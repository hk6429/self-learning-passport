export function setSafeText(node, value) {
  if (!node || !("textContent" in node)) {
    throw new TypeError("需要可寫入 textContent 的節點");
  }

  node.textContent = value === null || value === undefined ? "" : String(value);
  return node;
}

export function createTextElement(
  documentAdapter,
  tagName,
  text,
  { className = "" } = {},
) {
  if (typeof documentAdapter?.createElement !== "function") {
    throw new TypeError("需要可建立元素的 document adapter");
  }

  const node = documentAdapter.createElement(tagName);
  node.className = className;
  return setSafeText(node, text);
}
