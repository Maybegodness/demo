import simpleGit from 'simple-git';

const parseDiff = require('parse-diff') as typeof import('parse-diff');
const git: any = simpleGit();

/**
 * 获取本地仓库的 git diff 信息
 * @param repoPath 本地 Git 仓库路径
 */
async function getGitDiff(repoPath: string) {
  try {
    // 设置仓库路径
    console.log('--- Git Path ---');
    console.log(repoPath);
    git.cwd(repoPath);

    // 获取 diff 输出信息
    const diff = await git.diff();

    // 输出 diff 信息
    console.log('--- Git Diff Output ---');
    console.log(diff);

    return diff;
  } catch (error) {
    console.error('Error fetching git diff:', error);
  }
}

function createPrompt(file: File, chunk: Chunk): string {
  return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.

Review the following code diff in the file "${
    file.to
  }" and take the pull request title and description into account when writing the response.
  
Pull request title: ${prDetails.title}
Pull request description:

---
${prDetails.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
  // @ts-expect-error - ln and ln2 exists where needed
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
}

// async function getAIResponse(prompt: string): Promise<Array<{
//   lineNumber: string;
//   reviewComment: string;
// }> | null> {
//   const queryConfig = {
//     model: OPENAI_API_MODEL,
//     temperature: 0.2,
//     max_tokens: 700,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0,
//   };

//   try {
//     const response = await openai.chat.completions.create({
//       ...queryConfig,
//       // return JSON if the model supports it:
//       ...(OPENAI_API_MODEL === "gpt-4-1106-preview"
//         ? { response_format: { type: "json_object" } }
//         : {}),
//       messages: [
//         {
//           role: "system",
//           content: prompt,
//         },
//       ],
//     });

//     const res = response.choices[0].message?.content?.trim() || "{}";
//     return JSON.parse(res).reviews;
//   } catch (error) {
//     console.error("Error:", error);
//     return null;
//   }
// }

// function createComment(
//   file: File,
//   chunk: Chunk,
//   aiResponses: Array<{
//     lineNumber: string;
//     reviewComment: string;
//   }>
// ): Array<{ body: string; path: string; line: number }> {
//   return aiResponses.flatMap((aiResponse) => {
//     if (!file.to) {
//       return [];
//     }
//     return {
//       body: aiResponse.reviewComment,
//       path: file.to,
//       line: Number(aiResponse.lineNumber),
//     };
//   });
// }

async function main() {
  let diff: string | null;
 
  diff = await getGitDiff('E:\\Code\\libcoap');
  if (!diff) {
    console.log("No diff found");
    return;
  }

  const parsedDiff = parseDiff(diff);

  console.log('--- parseDiff Output ---');
  console.log(parsedDiff);

  for (const file of parsedDiff) {
    if (file.to === "/dev/null") continue; // Ignore deleted files
    for (const chunk of file.chunks) {
      const prompt = createPrompt(file.to, chunk);
      console.log(prompt);

      // const aiResponse = await getAIResponse(prompt);
      // if (aiResponse) {
      //   const newComments = createComment(file, chunk, aiResponse);
      //   if (newComments) {
      //     comments.push(...newComments);
      //   }
      // }
    }
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});