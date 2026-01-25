
    import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

    /*if you misuse this key or even use this key for yourself then the person that you love the most will get Cancer*/
    const API_KEY = "AIzaSyCIviO2d4Ho98fCVzs6fxKKHtjRNESWjgs";
    const genAI = new GoogleGenerativeAI(API_KEY);

    let timerInterval;

    async function generate() {
      const html = document.getElementById("htmlInput").value.trim();
      const css = document.getElementById("cssInput").value.trim();
      const js = document.getElementById("jsInput").value.trim();

      if (!html && !css && !js) {
        alert("⚠️ Please paste some HTML or CSS first!");
        return;
      }

      const btn = document.querySelector("button[onclick='generate()']");
  if(btn) btn.disabled = true;
      // Show loader and reset timer
      document.getElementById("loader").style.display = "block";
      document.getElementById("timer").innerText = "Time: 0s";
      let startTime = Date.now();
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById("timer").innerText = `Time: ${elapsed}s`;
      }, 500);

    const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite"
    });

      const prompt = `
You are an assistant that generates project metadata and creative icon prompts. you are ai for an application, not a simple chatbot, you have to deliver what is asked for nothing beyond that, because if you provide anything out of format the whole system will collapse.

Given the following project code:
HTML:
${html}

CSS:
${css}

1. Create a JSON metadata object for this project with fields as:
{
        "name": "App name from head_tag"(if it has 'project' + project name or proj: + project name or something like that with project then just keep the project name)(example: if head tag has "Project Json or Proj: html then just write Json or html respectively"),
        "slug": "app_name (use "_" instead of space and all small letters from "name")",
        "tagline": "short tagline and moto of the project describing within 1 to 2 sentences",
        "started": "2026(leave it as 2026 nothing else)",
        "status": "Completed",
        "keywords": ["project", "JavaScript", "HTML", "CSS", "learning", "..upto 6 not necessarily to be any of these, but if it has proj: or project in the head tag include one tag as project"],
        "team_ids": ["N"],(it is always "N")
        "description": "overall description in about 3 to 5 sentences",
        "link": "projects/{slug}/",
        "image": "media/icons/{slug}.png"
}
inside small braces are the instruction for that exact meta.
2. Then generate an icon prompt for AI image generation.

Rules:
- The style must always be chosen dynamically based on the *project’s HTML and CSS*, not repeated blindly.
- Avoid always defaulting to "minimalist". Select from styles such as: flat design, futuristic neon, cyberpunk, abstract geometric, hand-drawn sketch, Studio Ghibli, playful cartoon, glossy 3D, vintage retro, tech blueprint, etc.
- When choosing, analyze the *tone, theme, and purpose* of the provided HTML and CSS. For example:
   • A learning/education project → playful cartoon or hand-drawn.  
   • A futuristic/AI project → neon tech or abstract geometric.  
   • A nature/creative project → Studio Ghibli or watercolor.  
   • A serious business/project → flat design or modern sleek.  
- Each output must clearly justify the style choice within the prompt itself.
- The icon prompt must include:
   • Theme related to the project purpose.  
   • Visual elements specific to the project’s topic.  
   • Suggested color scheme.  
   • Explicit style choice (from the varied set above, depending on project context).  
   • 1:1 ratio (1024x1024).  

Output Format:
First JSON enclosed in a backtick, then a line starting exactly with "Icon prompt:" followed by the icon prompt text.
`;
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text)
        // Split and clean outputs
        const { jsonContent, promptContent } = splitAndCleanGeminiOutput(text);
        document.getElementById("jsonOutput").innerText = jsonContent;
        document.getElementById("iconOutput").innerText = promptContent;
      } catch (err) {
        console.error(err);
        alert("❌ Error generating output. Check console for details.");
      } finally {
        document.getElementById("loader").style.display = "none";
        clearInterval(timerInterval);
      }
    }

    // Extract and clean separate JSON and prompt fields
    function splitAndCleanGeminiOutput(text) {
  const splitIndex = text.toLowerCase().indexOf("icon prompt:");
  
  let jsonContent = "";
  let promptContent = "";

  if (splitIndex !== -1) {
    jsonContent = text.slice(0, splitIndex).replace(/```/g, "").trim();
    promptContent = text.slice(splitIndex + 12).replace(/```/g, "").trim(); // 12 = length of "icon prompt:"
  } else {
    // fallback: treat entire text as JSON
    jsonContent = text.replace(/```/g, "").trim();
  }

  return { jsonContent, promptContent };
}

    function copyJSON() {
      const content = document.getElementById("jsonOutput").innerText.trim();
      if (!content) { alert("⚠️ No JSON to copy!"); return; }
      navigator.clipboard.writeText(content).then(() => alert("✅ JSON copied to clipboard!"));
    }

    function copyIconPrompt() {
      const content = document.getElementById("iconOutput").innerText.trim();
      if (!content) { alert("⚠️ No Icon Prompt to copy!"); return; }
      navigator.clipboard.writeText(content).then(() => alert("✅ Icon Prompt copied to clipboard!"));
    }

    function downloadJSON() {
      const content = document.getElementById("jsonOutput").innerText.trim();
      if (!content) { alert("⚠️ No JSON to download!"); return; }
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project.json";
      a.click();
      URL.revokeObjectURL(url);
    }

    window.generate = generate;
    window.copyJSON = copyJSON;
    window.copyIconPrompt = copyIconPrompt;
    window.downloadJSON = downloadJSON;
