import { NextResponse } from "next/server"
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime"

const client = new BedrockRuntimeClient({
  region: "us-east-1",
})

export async function POST(req: Request) {
  try {
    const { caption } = await req.json()

    const prompt = `
You are an expert social media content strategist.

Rewrite the following caption to make it highly engaging for Instagram.

Requirements:
- Add relevant emojis
- Improve storytelling
- Add 5-8 trending hashtags
- Keep it natural and engaging

Caption:
${caption}
`

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    const response = await client.send(command)

    const decodedResponse = new TextDecoder().decode(response.body)
    const parsed = JSON.parse(decodedResponse)

    const generatedCaption =
      parsed?.content?.[0]?.text || "AI could not generate a caption."

    return NextResponse.json({
      caption: generatedCaption,
    })
  } catch (error) {
    console.error("Bedrock error:", error)

    return NextResponse.json(
      {
        caption: "AI generation failed. Please try again.",
      },
      { status: 500 }
    )
  }
}