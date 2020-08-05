import marked from "marked";

const cache = {};

const fetchOptions = {
  method: "GET",
  credentials: "same-origin"
};

export const fetchMarkdown = url => {
  if (cache[url]) {
    return Promise.resolve(cache[url]);
  } else {
    return fetch(url, fetchOptions).then(res => res.text()).then(text => {
      const htmlTerms = marked(text);
      const htmlTermsHrefs = htmlTerms.replace(/<a href=/g, "<a target=\"_blank\" href=");
      cache[url] = htmlTermsHrefs;
      return htmlTermsHrefs;
    });
  }

}