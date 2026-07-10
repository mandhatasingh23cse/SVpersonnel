const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { getClient, throwOnError } = require("./supabaseStore");

const DATA_FILE = path.join(__dirname, "../data/workRequirements.json");

// Ensure data file exists
if (!fsSync.existsSync(DATA_FILE)) {
  if (!fsSync.existsSync(path.dirname(DATA_FILE))) {
    fsSync.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fsSync.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

async function getLocalData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local work requirements:", err.message);
  }
}

async function getAllWorkRequirements() {
  // First try Supabase if table exists
  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("work_requirements")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        // Merge or return
        return data.map(item => ({
          id: item.id,
          clientId: item.client_id,
          clientName: item.client_name,
          clientContact: item.client_contact,
          category: item.category,
          subCategory: item.sub_category || "",
          location: item.location,
          budget: item.budget_inr,
          jobType: item.job_type,
          description: item.description,
          createdAt: item.created_at,
          applications: item.applications || []
        }));
      }
    }
  } catch (e) {
    // Supabase table not created or offline, fall through to local
  }

  return await getLocalData();
}

async function getWorkRequirementById(workId) {
  const all = await getAllWorkRequirements();
  return all.find(w => String(w.id) === String(workId)) || null;
}

async function getWorkRequirementsForProfessional(user) {
  const all = await getAllWorkRequirements();
  if (!user || user.role !== "professional") {
    return [];
  }

  // Extract all relevant categories/skills from the professional profile
  const userPrimary = (user.primarySkill || "").toLowerCase().trim();
  const userBio = (user.bio || "").toLowerCase();
  
  return all.filter(job => {
    const jobCat = (job.category || "").toLowerCase().trim();
    if (!jobCat) return true;
    if (jobCat === "all" || jobCat === "other") return true;
    
    // Check if exact category matches primary skill
    if (userPrimary && (jobCat.includes(userPrimary) || userPrimary.includes(jobCat))) {
      return true;
    }

    // Check if category matches any skills ticked in onboarding (stored in bio or category string)
    if (userBio.includes(jobCat)) {
      return true;
    }

    // Keyword matching between job category and professional title / skills
    const jobWords = jobCat.split(/[\s,&]+/).map(w => w.trim()).filter(w => w.length > 3);
    for (const word of jobWords) {
      if (userPrimary.includes(word) || userBio.includes(word)) {
        return true;
      }
    }

    return false;
  });
}

async function getWorkRequirementsByClient(clientIdOrEmail) {
  const all = await getAllWorkRequirements();
  const target = String(clientIdOrEmail || "").toLowerCase().trim();
  return all.filter(w => 
    String(w.clientId || "").toLowerCase() === target ||
    String(w.clientContact || "").toLowerCase() === target
  );
}

async function createWorkRequirement(jobData) {
  const finalCategory = jobData.subCategory ? `${jobData.category} — ${jobData.subCategory}` : (jobData.category || "General");
  const newJob = {
    id: "work_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    clientId: jobData.clientId || null,
    clientName: jobData.clientName || "Verified Client",
    clientContact: jobData.clientContact || "",
    category: finalCategory,
    subCategory: jobData.subCategory || "",
    location: jobData.location || "All India",
    budget: Number(jobData.budget) || 0,
    jobType: jobData.jobType || "Full Time",
    description: jobData.description || "",
    createdAt: new Date().toISOString(),
    applications: []
  };

  // Try saving to Supabase if table exists
  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("work_requirements")
        .insert({
          id: newJob.id,
          client_id: newJob.clientId,
          client_name: newJob.clientName,
          client_contact: newJob.clientContact,
          category: newJob.category,
          sub_category: newJob.subCategory,
          location: newJob.location,
          budget_inr: newJob.budget,
          job_type: newJob.jobType,
          description: newJob.description,
          created_at: newJob.createdAt,
          applications: []
        });
      if (!error) {
        // Also save to local backup
        const local = await getLocalData();
        local.unshift(newJob);
        await saveLocalData(local);
        return newJob;
      }
    }
  } catch (e) {
    // Ignore error if table doesn't exist
  }

  const local = await getLocalData();
  local.unshift(newJob);
  await saveLocalData(local);
  return newJob;
}

async function applyOrNegotiateWorkRequirement(workId, proposalData) {
  const all = await getAllWorkRequirements();
  const index = all.findIndex(w => String(w.id) === String(workId));
  if (index === -1) {
    throw new Error("Work requirement not found.");
  }

  const work = all[index];
  work.applications = work.applications || [];

  const newApp = {
    id: "app_" + Date.now(),
    professionalId: proposalData.professionalId || null,
    professionalName: proposalData.professionalName || "Professional",
    professionalPhone: proposalData.professionalPhone || "",
    professionalEmail: proposalData.professionalEmail || "",
    proposedRate: Number(proposalData.proposedRate) || 0,
    message: proposalData.message || "",
    createdAt: new Date().toISOString()
  };

  work.applications.push(newApp);

  // Try updating Supabase
  try {
    const client = getClient();
    if (client) {
      await client
        .from("work_requirements")
        .update({ applications: work.applications })
        .eq("id", workId);
    }
  } catch (e) {
    // Ignore
  }

  await saveLocalData(all);
  return newApp;
}

module.exports = {
  getAllWorkRequirements,
  getWorkRequirementById,
  getWorkRequirementsForProfessional,
  getWorkRequirementsByClient,
  createWorkRequirement,
  applyOrNegotiateWorkRequirement
};
