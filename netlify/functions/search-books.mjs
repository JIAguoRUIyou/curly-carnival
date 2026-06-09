export default async (request) => {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q")?.trim();

  if (!query) {
    return json({ docs: [], error: "missing query" }, 400);
  }

  try {
    const apiUrl = new URL("https://openlibrary.org/search.json");
    apiUrl.searchParams.set("title", query);
    apiUrl.searchParams.set("limit", "9");
    apiUrl.searchParams.set("fields", "title,author_name,first_publish_year,subject");

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Open Library returned ${response.status}`);
    const data = await response.json();
    return json({ docs: data.docs || [] });
  } catch (error) {
    return json({ docs: [], error: "search unavailable", message: error.message }, 502);
  }
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*"
    }
  });
}
