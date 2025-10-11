// Shared Anthropic/Claude client for Edge Functions
// Per 작업서: Claude for (a) 프로필 요약·톤 분석, (b) 임베딩 생성, (c) 운영 자동화

import Anthropic from "npm:@anthropic-ai/sdk@0.28.0";

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY") || "",
});

export interface ProfileAnalysis {
  summary: string;
  tone: {
    extroversion: number; // 0-100
    openness: number;
    adventurous: number;
  };
  tags: string[];
  safety_flags: string[];
}

export async function analyzeProfile(
  introText: string,
  valuesJson: Record<string, unknown>
): Promise<ProfileAnalysis> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `다음 사용자 프로필을 분석해주세요:

자기소개: ${introText}
가치관: ${JSON.stringify(valuesJson, null, 2)}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "200자 이내 요약",
  "tone": {
    "extroversion": 0-100,
    "openness": 0-100,
    "adventurous": 0-100
  },
  "tags": ["추출된", "취향", "태그"],
  "safety_flags": ["발견된 안전 이슈 또는 빈 배열"]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return JSON.parse(content.text);
  }

  throw new Error("Unexpected response format");
}

export interface ModerationLabel {
  provider: string;
  label: string;
  score?: number;
}

export interface ModerationResult {
  flagged: boolean;
  confidence: number;
  reasons: string[];
  severity: "low" | "medium" | "high";
  labels?: ModerationLabel[];
}

function ensureLabels(result: any): ModerationResult {
  if (!result.labels && Array.isArray(result.reasons)) {
    result.labels = result.reasons.map((reason: string) => ({
      provider: "claude",
      label: reason,
      score: result.confidence ?? null,
    }));
  }
  return result as ModerationResult;
}

export async function moderateContent(
  content: string,
  type: "profile" | "message" | "photo_caption",
): Promise<ModerationResult> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `다음 ${type} 콘텐츠를 한국어 데이팅 앱 기준으로 모더레이션해주세요:

"${content}"

다음 항목을 검사하세요:
- 욕설/비속어
- 성희롱/성적 콘텐츠
- 금전 요구/사기 징후
- 폭력적 표현
- 개인정보 노출

JSON 형식으로 응답:
{
  "flagged": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["발견된 문제들"],
  "severity": "low|medium|high"
}`,
      },
    ],
  });

  const content_resp = message.content[0];
  if (content_resp.type === "text") {
    const parsed = JSON.parse(content_resp.text);
    return ensureLabels(parsed);
  }

  throw new Error("Unexpected response format");
}

/**
 * Image moderation using Claude vision API.
 * Accepts a public image URL and returns moderation result JSON.
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "url",
              media_type: "image/jpeg",
              url: imageUrl,
            },
          },
          {
            type: "text",
            text: `해당 이미지를 한국어 데이팅 앱 기준으로 모더레이션하세요. 다음 항목을 점검하고 JSON으로만 응답하세요:\n- 노출/성적 콘텐츠\n- 폭력성\n- 혐오/차별\n- 불법/위험 행위\n- 기타 규정 위반\n\n응답 JSON 형식:\n{\n  "flagged": true/false,\n  "confidence": 0.0-1.0,\n  "reasons": ["발견된 문제들"],\n  "severity": "low|medium|high"\n}`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    const parsed = JSON.parse(content.text);
    return ensureLabels(parsed);
  }
  throw new Error("Unexpected response format for image moderation");
}

export interface MatchExplanation {
  reasons: string[];
  summary: string;
}

export async function generateMatchReason(
  userA: { intro: string; tags: string[] },
  userB: { intro: string; tags: string[] },
  commonTags: string[]
): Promise<MatchExplanation> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `두 사용자를 매칭한 이유를 한국어로 설명해주세요:

사용자 A: ${userA.intro} (태그: ${userA.tags.join(", ")})
사용자 B: ${userB.intro} (태그: ${userB.tags.join(", ")})
공통 태그: ${commonTags.join(", ")}

JSON 형식으로 응답:
{
  "reasons": ["이유1", "이유2", "이유3"],
  "summary": "한 문장 요약"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return JSON.parse(content.text);
  }

  throw new Error("Unexpected response format");
}
