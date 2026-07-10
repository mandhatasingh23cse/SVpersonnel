const fsSync = require("fs");
const fs = require("fs/promises");
const path = require("path");
const { getClient } = require("./supabaseStore");

const DATA_FILE = path.join(__dirname, "../data/clientAddresses.json");

if (!fsSync.existsSync(DATA_FILE)) {
  if (!fsSync.existsSync(path.dirname(DATA_FILE))) {
    fsSync.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  fsSync.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

async function getLocalAddresses() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    return [];
  }
}

async function saveLocalAddresses(list) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local client addresses:", err.message);
  }
}

async function getAddressesByClient(clientIdOrEmail) {
  const target = String(clientIdOrEmail || "").toLowerCase().trim();
  if (!target) return [];

  try {
    const client = getClient();
    if (client) {
      const { data, error } = await client
        .from("client_addresses")
        .select("*")
        .eq("client_id", target);
      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          clientId: item.client_id,
          name: item.name,
          phone: item.phone,
          pincode: item.pincode,
          locality: item.locality,
          address: item.address,
          city: item.city,
          state: item.state,
          landmark: item.landmark,
          alternatePhone: item.alternate_phone,
          addressType: item.address_type || "Home",
          createdAt: item.created_at
        }));
      }
    }
  } catch (e) {
    // Fallback to local
  }

  const local = await getLocalAddresses();
  return local.filter(a => String(a.clientId).toLowerCase() === target);
}

async function addClientAddress(clientIdOrEmail, addressData) {
  const target = String(clientIdOrEmail || "").toLowerCase().trim();
  const newAddr = {
    id: "addr_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    clientId: target,
    name: addressData.name || "",
    phone: addressData.phone || "",
    pincode: addressData.pincode || "",
    locality: addressData.locality || "",
    address: addressData.address || "",
    city: addressData.city || "",
    state: addressData.state || "",
    landmark: addressData.landmark || "",
    alternatePhone: addressData.alternatePhone || "",
    addressType: addressData.addressType || "Home",
    createdAt: new Date().toISOString()
  };

  try {
    const client = getClient();
    if (client) {
      const { error } = await client
        .from("client_addresses")
        .insert({
          id: newAddr.id,
          client_id: newAddr.clientId,
          name: newAddr.name,
          phone: newAddr.phone,
          pincode: newAddr.pincode,
          locality: newAddr.locality,
          address: newAddr.address,
          city: newAddr.city,
          state: newAddr.state,
          landmark: newAddr.landmark,
          alternate_phone: newAddr.alternatePhone,
          address_type: newAddr.addressType,
          created_at: newAddr.createdAt
        });
      if (!error) {
        const local = await getLocalAddresses();
        local.push(newAddr);
        await saveLocalAddresses(local);
        return newAddr;
      }
    }
  } catch (e) {
    // Fallback
  }

  const local = await getLocalAddresses();
  local.push(newAddr);
  await saveLocalAddresses(local);
  return newAddr;
}

async function deleteClientAddress(addressId, clientIdOrEmail) {
  const target = String(clientIdOrEmail || "").toLowerCase().trim();
  try {
    const client = getClient();
    if (client) {
      await client
        .from("client_addresses")
        .delete()
        .eq("id", addressId)
        .eq("client_id", target);
    }
  } catch (e) {
    // Ignore
  }

  const local = await getLocalAddresses();
  const filtered = local.filter(a => !(String(a.id) === String(addressId) && String(a.clientId).toLowerCase() === target));
  await saveLocalAddresses(filtered);
  return true;
}

module.exports = {
  getAddressesByClient,
  addClientAddress,
  deleteClientAddress
};
