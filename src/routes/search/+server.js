import { json } from "@sveltejs/kit";

export async function GET({ url }) {
  try {
    const search = url.searchParams.get("q");
    if (!search) {
      return json([]);
    }

    const searchUrl = "http://nominatim.openstreetmap.org/search";
    const requestUrl = `${searchUrl}?countrycodes=CZ&format=json&q=${search}`;
    console.log(requestUrl);

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    console.log(data);

    return json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return json({ error: error }, { status: 500 });
  }
}