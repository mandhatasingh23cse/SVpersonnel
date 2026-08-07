const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { getClient, getLocalClients, throwOnError } = require("./supabaseStore");

const DATA_FILE = path.join(__dirname, "../data/workRequirements.json");
const DELETED_FILE = path.join(__dirname, "../data/deletedWorkIds.json");

// Ensure data files exist
if (!fsSync.existsSync(DATA_FILE)) {
  if (!fsSync.existsSync(path.dirname(DATA_FILE))) {
    fsSync.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fsSync.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}
if (!fsSync.existsSync(DELETED_FILE)) {
  if (!fsSync.existsSync(path.dirname(DELETED_FILE))) {
    fsSync.mkdirSync(path.dirname(DELETED_FILE), { recursive: true });
  }
  fsSync.writeFileSync(DELETED_FILE, JSON.stringify([], null, 2), "utf8");
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

async function getDeletedIds() {
  try {
    const raw = await fs.readFile(DELETED_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function addDeletedId(id) {
  if (!id) return;
  const list = await getDeletedIds();
  const sid = String(id);
  if (!list.includes(sid)) {
    list.push(sid);
    try {
      await fs.writeFile(DELETED_FILE, JSON.stringify(list, null, 2), "utf8");
    } catch(e) {}
  }
}

async function getAllWorkRequirements() {
  let supabaseJobs = [];
  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("work_requirements")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        supabaseJobs = data.map(item => ({
          id: String(item.id),
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
    // Supabase table offline or missing
  }

  const deletedList = await getDeletedIds();
  const deletedSet = new Set(deletedList.map(item => String(item).toLowerCase().trim()));

  const isJobDeleted = (job) => {
    if (!job) return true;
    if (job.status === "deleted") return true;
    const sId = String(job.id || "").toLowerCase().trim();
    const digitsOnly = sId.replace(/\D/g, "");
    if (deletedSet.has(sId)) return true;
    if (digitsOnly && deletedSet.has(digitsOnly)) return true;
    if (job.description && deletedSet.has(String(job.description).toLowerCase().trim())) return true;
    return false;
  };

  const localJobs = await getLocalData();
  const map = new Map();
  for (const job of localJobs) {
    if (job && job.id && !isJobDeleted(job)) map.set(String(job.id), job);
  }
  for (const job of supabaseJobs) {
    if (job && job.id && !isJobDeleted(job)) map.set(String(job.id), job);
  }

  const localClients = await getLocalClients();
  const merged = Array.from(map.values()).filter(j => !isJobDeleted(j));
  merged.forEach(job => {
    if (!job.clientContact) {
      const match = localClients.find(c => String(c.id) === String(job.clientId) || (c.email && c.email.toLowerCase() === (job.clientEmail || "").toLowerCase()));
      if (match) job.clientContact = match.phone || match.contact || "";
    }
  });

  merged.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
  return merged;
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

  const userPrimary = (user.primarySkill || "").toLowerCase().trim();
  const userBio = (user.bio || "").toLowerCase();
  
  return all.filter(job => {
    const jobCat = (job.category || "").toLowerCase().trim();
    if (!jobCat) return true;
    if (jobCat === "all" || jobCat === "other") return true;
    
    if (userPrimary && (jobCat.includes(userPrimary) || userPrimary.includes(jobCat))) {
      return true;
    }

    if (userBio.includes(jobCat)) {
      return true;
    }

    const jobWords = jobCat.split(/[\s,&]+/).map(w => w.trim()).filter(w => w.length > 3);
    for (const word of jobWords) {
      if (userPrimary.includes(word) || userBio.includes(word)) {
        return true;
      }
    }

    return false;
  });
}

async function getWorkRequirementsForPartner(user) {
  const all = await getAllWorkRequirements();
  if (!user || user.role !== "partner") {
    return [];
  }

  const partnerCity = (user.city || user.location || user.address || "").toLowerCase().trim();
  if (!partnerCity || partnerCity === "all india" || partnerCity === "india") {
    return all;
  }

  return all.filter(job => {
    const jobLoc = (job.location || "").toLowerCase().trim();
    if (!jobLoc || jobLoc === "all india") return true;
    return jobLoc.includes(partnerCity) || partnerCity.includes(jobLoc);
  });
}

async function getWorkRequirementsByClient(clientIdOrEmail) {
  const all = await getAllWorkRequirements();
  if (!clientIdOrEmail) return [];
  const target = String(clientIdOrEmail).toLowerCase().trim();
  return all.filter(w => {
    const cid = String(w.clientId || w.client_id || "").toLowerCase().trim();
    const contact = String(w.clientContact || w.client_contact || "").toLowerCase().trim();
    return cid === target || contact === target || (cid && target && (cid === target || target.includes(cid))) || (contact && target && contact === target);
  });
}

async function createWorkRequirement(jobDataOrId, optionalData) {
  const jobData = (optionalData && typeof optionalData === 'object')
    ? { ...optionalData, clientId: jobDataOrId }
    : (jobDataOrId || {});
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

  // Always save to local data
  const local = await getLocalData();
  local.unshift(newJob);
  await saveLocalData(local);

  // Try saving to Supabase if table exists
  try {
    const client = getClient();
    if (client) {
      const nid = Number(newJob.clientId);
      await client
        .from("work_requirements")
        .insert({
          id: newJob.id,
          client_id: Number.isNaN(nid) ? null : nid,
          client_name: newJob.clientName,
          client_contact: newJob.clientContact,
          category: newJob.category,
          sub_category: newJob.subCategory,
          location: newJob.location,
          budget_inr: newJob.budget,
          job_type: newJob.jobType,
          description: newJob.description,
          created_at: newJob.createdAt
        });
    }
  } catch (e) {
    console.warn("Supabase work_requirements insert warning:", e.message);
  }

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

async function deleteWorkRequirement(workId, clientIdOrEmail) {
  const wid = String(workId || "").trim();
  const digitsOnly = wid.replace(/\D/g, "");

  await addDeletedId(wid);
  if (digitsOnly) await addDeletedId(digitsOnly);

  const local = await getLocalData();
  const targetJob = local.find(w => String(w.id) === wid || (digitsOnly && String(w.id).replace(/\D/g, "") === digitsOnly));

  if (targetJob) {
    if (targetJob.id) await addDeletedId(String(targetJob.id));
    if (targetJob.description) await addDeletedId(String(targetJob.description));
  }

  try {
    const client = getClient();
    if (client) {
      const nid = Number(wid) || Number(digitsOnly);
      if (!Number.isNaN(nid)) {
        await client.from("work_requirements").delete().eq("id", nid);
        await client.from("work_requirements").update({ status: "deleted" }).eq("id", nid);
      }
      await client.from("work_requirements").delete().eq("id", wid);
      await client.from("work_requirements").update({ status: "deleted" }).eq("id", wid);

      if (targetJob && targetJob.description) {
        await client.from("work_requirements").delete().eq("description", targetJob.description);
        await client.from("work_requirements").update({ status: "deleted" }).eq("description", targetJob.description);
      }
    }
  } catch (e) {
    console.warn("Supabase delete work_requirements warning:", e.message);
  }

  const filtered = local.filter(w => 
    String(w.id) !== wid && 
    (!digitsOnly || String(w.id).replace(/\D/g, "") !== digitsOnly) && 
    (!targetJob || w.description !== targetJob.description)
  );
  await saveLocalData(filtered);
  return true;
}

module.exports = {
  getAllWorkRequirements,
  getWorkRequirementById,
  getWorkRequirementsForProfessional,
  getWorkRequirementsForPartner,
  getWorkRequirementsByClient,
  createWorkRequirement,
  deleteWorkRequirement,
  applyOrNegotiateWorkRequirement,
};
