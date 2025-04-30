/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/x/sift@0.5.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@^2.0.0";
// at the top of supabase/functions/stitch/index.ts
import ffmpegCore from "https://cdn.skypack.dev/@ffmpeg/core";
import { createFFmpeg, fetchFile } from "https://cdn.skypack.dev/@ffmpeg/ffmpeg";


// initialize Supabase client with your project’s URL & service role key
const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const storageBucket = "video-logs";
serve(async (req) => {
    try {
        const { sessionId } = await req.json();

        // 1) List all chunks in the “videos” bucket under this session
        const { data: files, error: listErr } = await supabase
            .storage
            .from(storageBucket)
            .list(sessionId);
        if (listErr || !files) throw new Error(listErr?.message);

        // 2) Load FFmpeg-WASM
        const ffmpeg = createFFmpeg({
            corePath: ffmpegCore,
            log: true
        });
        await ffmpeg.load();

        // 3) Download each chunk and write into FFmpeg FS
        for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
            const { data: blob, error: dlErr } = await supabase
                .storage
                .from(storageBucket)
                .download(`${sessionId}/${file.name}`);
            if (dlErr || !blob) throw new Error(dlErr?.message);

            const bytes = new Uint8Array(await blob.arrayBuffer());
            ffmpeg.FS("writeFile", file.name, bytes);
        }

        // 4) Build concat list file
        const listTxt = files
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((f) => `file '${f.name}'`)
            .join("\n");
        ffmpeg.FS("writeFile", "concat.txt", new TextEncoder().encode(listTxt));

        // 5) Run the concat command
        await ffmpeg.run(
            "-f", "concat",
            "-safe", "0",
            "-i", "concat.txt",
            "-c", "copy",
            "final.webm"
        );

        // 6) Read the output and re-upload
        const output = ffmpeg.FS("readFile", "final.webm");
        const { error: upErr } = await supabase
            .storage
            .from(storageBucket)
            .upload(`${sessionId}/final.webm`, output, { contentType: "video/webm" });
        if (upErr) throw new Error(upErr.message);

        // 7) Return the public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(storageBucket)
            .getPublicUrl(`${sessionId}/final.webm`);

        return new Response(JSON.stringify({ url: publicUrl }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
