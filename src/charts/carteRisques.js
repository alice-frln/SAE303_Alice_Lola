// Carte V5 : établissements polluants, sites BASOL et zones PPRT (recopiée du notebook).
// Reçoit ses données en paramètre ; `document` permet le rendu au build (JSDOM).
import * as Plot from "@observablehq/plot";

export const carteRisques = (
  { communes, pprt = [], etablissements = [], basol = [] },
  {
    width = 720,
    titre = null,
    sousTitre = null,
    source = null,
    alt = "",
    document = undefined,
  } = {},
) =>
  Plot.plot({
    document,
    width,
    height: Math.round(width * 0.95),
    margin: 10,
    title: titre ?? undefined,
    subtitle: sousTitre ?? undefined,
    caption: source ?? undefined,
    ariaLabel: alt,
    projection: { type: "mercator", domain: { type: "FeatureCollection", features: communes } },
    color: {
      type: "categorical",
      domain: ["Hors zone PPRT", "Dans une zone PPRT"],
      range: ["#34473e", "#000000"],
      legend: true,
    },
    marks: [
      Plot.geo(communes, { fill: "#eee7e9", stroke: "white", strokeWidth: 1 }),
      // clip : une zone PPRT qui déborde de la commune affichée reste dans le cadre
      Plot.geo(pprt, { fill: "#ed8936", fillOpacity: 0.3, stroke: "#c05621", strokeWidth: 1.2, clip: true }),
      Plot.dot(basol.filter((b) => !b.enCours), { x: "lon", y: "lat", symbol: "times", r: 3.5, stroke: "#dc2626", strokeWidth: 1 }),
      Plot.dot(basol.filter((b) => b.enCours), { x: "lon", y: "lat", symbol: "times", r: 3.5, stroke: "#34473e", strokeWidth: 1.4 }),
      Plot.dot(etablissements, {
        x: "lon", y: "lat", r: 4.5,
        fill: (d) => (d.dansPprt ? "Dans une zone PPRT" : "Hors zone PPRT"),
        fillOpacity: 0.8, stroke: "white", strokeWidth: 0.8,
      }),
      Plot.dot([0], { symbol: "times", r: 3.5, stroke: "#34473e", strokeWidth: 1.4, frameAnchor: "bottom-left", dx: 12, dy: -30 }),
      Plot.text([`Site BASOL, dossier en cours (${basol.filter((b) => b.enCours).length})`], {
        frameAnchor: "bottom-left", textAnchor: "start", dx: 22, dy: -30, fontSize: 10, fill: "#000000", stroke: "white", strokeWidth: 3,
      }),
      Plot.dot([0], { symbol: "times", r: 3.5, stroke: "#dc2626", strokeWidth: 1, frameAnchor: "bottom-left", dx: 12, dy: -12 }),
      Plot.text([`Site BASOL, dossier clôturé (${basol.filter((b) => !b.enCours).length})`], {
        frameAnchor: "bottom-left", textAnchor: "start", dx: 22, dy: -12, fontSize: 10, fill: "#000000", stroke: "white", strokeWidth: 3,
      }),
      Plot.text(communes, Plot.centroid({
        text: (d) => d.properties.nom, fill: "#34473e", fontSize: 9, stroke: "white", strokeWidth: 3,
      })),
    ],
  });
