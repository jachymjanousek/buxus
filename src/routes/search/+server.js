import { json } from "@sveltejs/kit";

export async function GET({ url }) {
  try {
    const search = url.searchParams.get("q");
    if (!search) {
      return json([]);
    }

    const searchUrl = "http://nominatim.openstreetmap.org/search";
    const requestUrl = `${searchUrl}?countrycodes=CZ&format=json&q=${search}`;

    const headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("Content-Type", "application/json");
    headers.append("User-Agent", "zdravybuxus.com (janousekjachym@gmail.com");

    const response = await fetch(requestUrl, {
      method: "GET",
      headers,
    });

    const { result, contentType } = await processResponse(response);

    return json(result);
  } catch (error) {
    console.error("Error fetching data:", JSON.stringify(error));
    return json({ error: error }, { status: 500 });
  }
}

// gatherResponse returns both content-type & response body as a string
async function processResponse(response) {
  const { headers } = response;
  const contentType = headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return { contentType, result: await response.json() };
  }
  return { contentType, result: response.text() };
}
