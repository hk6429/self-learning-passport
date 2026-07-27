const jsonResponse = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });

export const jsonOk = (data, status = 200) =>
  jsonResponse({ ok: true, data }, status);

export const jsonError = (code, message, status = 400) =>
  jsonResponse(
    {
      ok: false,
      error: { code, message },
    },
    status,
  );
