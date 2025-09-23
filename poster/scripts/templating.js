/** execute comments as javascript and replace with result */
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
    try {
      let content = comment.nodeValue.trim();
      /** only execute comments starting with $ */
      if (!content.startsWith("$")) continue;
      content = content.replace(/^\$/, "");
      /** evaluate comment as javascript */
      const result = eval(content);
      /** replace comment node with text node of eval result */
      const text = document.createTextNode(String(result));
      comment.parentNode.replaceChild(text, comment);
    } catch (error) {
      console.error(error);
    }
  }
});

/** trim code blocks */
window.addEventListener("DOMContentLoaded", () => {
  const blocks = document.querySelectorAll(".code-block > code > pre");
  for (const block of blocks) block.innerHTML = block.innerHTML.trim();
});

/** inline svgs */
window.addEventListener("DOMContentLoaded", async () => {
  /** get all img tags with an svg src */
  const imgs = document.querySelectorAll("img[src*='.svg']");

  for (const img of imgs) {
    /** fetch raw svg file text content */
    const content = await (await fetch(img.src)).text();
    /** insert svg source as new node */
    img.insertAdjacentHTML("beforebegin", content);
    /** get new node */
    let svg = img.previousElementSibling;
    /** remove certain attributes on svg */
    for (const attr of ["width", "height"]) svg.removeAttribute(attr);
    /** handle icons */
    if (img.src.includes("icons")) svg.classList.add("icon");
    /** transfer over attributes from img to svg */
    for (const { name, value } of img.attributes) {
      if (name === "class")
        for (const _class of img.classList) svg.classList.add(_class);
      else svg.setAttribute(name, value);
    }
    /** delete img tag */
    img.remove();
  }
});

/** make all links open in new tab */
window.addEventListener("DOMContentLoaded", () =>
  document
    .querySelectorAll("a")
    .forEach((link) => link.setAttribute("target", "_blank"))
);
