window.addEventListener("data", () => {
  /** walker to go through dom nodes */
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_COMMENT
  );
  let node;

  /** find all comment nodes */
  const comments = [];
  while ((node = walker.nextNode())) comments.push(node);

  /** for each comment */
  for (const comment of comments) {
    const content = comment.nodeValue.trim();
    /** evaluate comment as javascript */
    const result = eval(content);
    /** replace comment node with text node of eval result */
    const text = document.createTextNode(String(result));
    comment.parentNode.replaceChild(text, comment);
  }
});
