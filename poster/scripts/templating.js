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
      const content = comment.nodeValue.trim();
      /** evaluate comment as javascript */
      const result = eval(content);
      /** replace comment node with text node of eval result */
      const text = document.createTextNode(String(result));
      comment.parentNode.replaceChild(text, comment);
    } catch (error) {
      // console.error(error);
    }
  }
});

/** trim code blocks */
window.addEventListener("load", () => {
  const blocks = document.querySelectorAll(".code-block > code > pre");
  for (const block of blocks) block.innerHTML = block.innerHTML.trim();
});

/** inline svgs */
window.addEventListener("load", async () => {
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
    for (const { name, value } of img.attributes) svg.setAttribute(name, value);
    /** delete img tag */
    img.remove();
  }
});

/** create gallery images */
window.addEventListener("load", () => {
  const gallery = document.querySelector(".gallery");
  const count = 20;
  for (let index = 0; index <= count; index++) {
    const item = document.createElement("div");
    gallery.append(item);
    const img = document.createElement("img");
    img.src = `images/labs/${index}.jpg`;
    item.append(img);
  }
});

/** wrap element in wrapper element */
const wrap = (element, wrapper) => {
  element.parentNode.insertBefore(wrapper, element);
  wrapper.append(element);
  return wrapper;
};
