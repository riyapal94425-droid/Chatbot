const { createClient } = require("@supabase/supabase-js");

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (
      !url ||
      !key ||
      url.includes("your-project") ||
      key.includes("your_service_role_key_here") ||
      key.startsWith("your_")
    ) {
      return null;
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  const client = getSupabase();
  if (!client) {
    return res.status(500).json({ error: "Supabase not configured. Check .env file." });
  }

  try {
    const { fileName, fileType, fileBase64 } = req.body;
    const userId = req.user.id;

    if (!fileName || !fileType || !fileBase64) {
      return res.status(400).json({ error: "fileName, fileType, and fileBase64 are required" });
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await client.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = client.storage
      .from("uploads")
      .getPublicUrl(filePath);

    let fileRecord = {
      user_id: userId,
      file_name: fileName,
      file_url: urlData.publicUrl,
      mime_type: fileType,
    };

    let dbError = null;
    try {
      const res = await client
        .from("files")
        .insert(fileRecord)
        .select()
        .single();
      if (res.error) dbError = res.error;
      else fileRecord = res.data;
    } catch (err) {
      dbError = err;
    }

    if (dbError) {
      console.warn("Could not save file record to files table:", dbError.message);
    }

    res.json({ file: fileRecord });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
