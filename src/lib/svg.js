// Contours simplifiés : sommets arrondis au pixel, doublons consécutifs retirés.
// Les géométries ont des dizaines de milliers de points, bien plus que l'écran n'en affiche.
function simplifierTrace(d) {
  return d.replace(/M[^MZ]+Z?/g, (anneau) => {
    const ferme = anneau.endsWith("Z");
    const points = anneau.replace(/[MZ]/g, "").split("L").map((p) => p.split(",").map((v) => Math.round(+v)));
    const garde = points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
    return "M" + garde.map((p) => p.join(",")).join("L") + (ferme ? "Z" : "");
  });
}

export function simplifierTraces(figure) {
  for (const path of figure.querySelectorAll("path[d]")) {
    path.setAttribute("d", simplifierTrace(path.getAttribute("d")));
  }
  return figure;
}
