export function query(selector, parent = document) {
  return parent.querySelector(selector);
}

export function isElement(value) {
  return value instanceof Element;
}
