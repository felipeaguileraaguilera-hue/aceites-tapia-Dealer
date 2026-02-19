const B = "https://www.aceitestapia.com/wp-content/uploads";

export const FALLBACK_CATALOG = [
  { id:"F-PET-5L",   name:"PET Filtrado 5L",       description:"Caja 3 ud",  section:"PET Filtrado",    image_url:`${B}/2020/06/CAJA-PET-5L-300x300.jpg`, display_order:10 },
  { id:"F-PET-2L",   name:"PET Filtrado 2L",       description:"Caja 6 ud",  section:"PET Filtrado",    image_url:`${B}/2018/10/caja-PET-2L-300x300.jpg`, display_order:20 },
  { id:"F-PET-1L",   name:"PET Filtrado 1L",       description:"Caja 12 ud", section:"PET Filtrado",    image_url:`${B}/2018/10/caja-PET-1L-300x300.jpg`, display_order:30 },
  { id:"F-PET-500",  name:"PET Filtrado 500ml",    description:"Caja 20 ud", section:"PET Filtrado",    image_url:`${B}/2020/06/CAJA-PET-500ML-300x300.jpeg`, display_order:40 },
  { id:"F-VT-750",   name:"Vidrio Filtrado 750ml", description:"Caja 15 ud", section:"Vidrio Filtrado", image_url:`${B}/2020/06/CAJA-MT750ML-300x300.jpg`, display_order:50 },
  { id:"F-VT-500",   name:"Vidrio Filtrado 500ml", description:"Caja 24 ud", section:"Vidrio Filtrado", image_url:`${B}/2020/06/CAJA-MT500ML-300x300.jpg`, display_order:60 },
  { id:"SF-PET-5L",  name:"PET Sin Filtrar 5L",    description:"Caja 3 ud",  section:"PET Sin Filtrar", image_url:`${B}/2020/06/CAJA-PET-5L-300x300.jpg`, display_order:70 },
  { id:"SF-PET-2L",  name:"PET Sin Filtrar 2L",    description:"Caja 6 ud",  section:"PET Sin Filtrar", image_url:`${B}/2018/10/caja-PET-2L-300x300.jpg`, display_order:80 },
  { id:"SF-PET-1L",  name:"PET Sin Filtrar 1L",    description:"Caja 15 ud", section:"PET Sin Filtrar", image_url:`${B}/2018/10/caja-PET-1L-300x300.jpg`, display_order:90 },
  { id:"SF-PET-500", name:"PET Sin Filtrar 500ml", description:"Caja 20 ud", section:"PET Sin Filtrar", image_url:`${B}/2020/06/CAJA-PET-500ML-300x300.jpeg`, display_order:100 },
  { id:"MONO-AOVE",  name:"Monodosis AOVE 20ml",  description:"Caja 160 ud",section:"Monodosis AOVE",  image_url:`${B}/2021/05/TARRINA-AOVE-20ML-300x300.jpg`, display_order:110 },
  { id:"SF-VT-750",  name:"Vidrio Sin Filtrar 750ml",description:"Caja 15 ud",section:"Vidrio Sin Filtrar",image_url:`${B}/2020/06/CAJA-MT750ML-300x300.jpg`, display_order:120 },
  { id:"SF-VT-500",  name:"Vidrio Sin Filtrar 500ml",description:"Caja 24 ud",section:"Vidrio Sin Filtrar",image_url:`${B}/2020/06/CAJA-MT500ML-300x300.jpg`, display_order:130 },
  { id:"VO-L-5L",    name:"Verde Oleum Lata 5L",   description:"Caja 4 ud",  section:"Verde Oleum",    image_url:`${B}/2018/10/CAJA-LATA-5L-VERDE-OLEUM-1-300x300.jpg`, display_order:140 },
  { id:"VO-L-750",   name:"Verde Oleum Lata 750ml",description:"Caja 15 ud", section:"Verde Oleum",    image_url:`${B}/2018/10/CAJA-LATA-750ML-VERDE-OLEUM-300x300.jpg`, display_order:150 },
  { id:"VO-B-500",   name:"Verde Oleum Bot. 500ml",description:"Caja 15 ud", section:"Verde Oleum",    image_url:`${B}/2018/10/CAJA-BOTELLA-500ML-VERDE-OLEUM-300x300.jpg`, display_order:160 },
  { id:"VO-L-250",   name:"Verde Oleum Lata 250ml",description:"Caja 28 ud", section:"Verde Oleum",    image_url:`${B}/2018/10/CAJA-LATA-250ML-VERDE-OLEUM-300x300.jpg`, display_order:170 },
  { id:"VO-B-250",   name:"Verde Oleum Bot. 250ml",description:"Caja 30 ud", section:"Verde Oleum",    image_url:`${B}/2018/10/CAJA-BOTELLA-250ML-VERDE-OLEUM-300x300.jpg`, display_order:180 },
  { id:"DEL-500",    name:"Delirium 500ml",        description:"Unidad",     section:"Delirium",       image_url:`${B}/2021/01/DELIRIUM-300x300.jpg`, display_order:190 },
];

export const SEC_COLORS = {
  "PET Filtrado":      { bg:"#FFF8E1", color:"#E65100", icon:"📦" },
  "Vidrio Filtrado":   { bg:"#FFF3E0", color:"#BF360C", icon:"🍶" },
  "PET Sin Filtrar":   { bg:"#E8F5E9", color:"#2E7D32", icon:"📦" },
  "Monodosis AOVE":    { bg:"#FBE9E7", color:"#D84315", icon:"🔸" },
  "Vidrio Sin Filtrar":{ bg:"#F1F8E9", color:"#33691E", icon:"🍶" },
  "Verde Oleum":       { bg:"#E0F2F1", color:"#00695C", icon:"🌿" },
  "Delirium":          { bg:"#F3E5F5", color:"#6A1B9A", icon:"✨" },
};

export const SECTION_BG = {
  "PET Filtrado":"#FFF8E1","Vidrio Filtrado":"#FFF3E0","PET Sin Filtrar":"#E8F5E9",
  "Monodosis AOVE":"#FBE9E7","Vidrio Sin Filtrar":"#F1F8E9","Verde Oleum":"#E0F2F1","Delirium":"#F3E5F5",
};

export const FILTER_CATS = [
  { label:"Todos", match:null },
  { label:"Filtrado", match:["PET Filtrado","Vidrio Filtrado"] },
  { label:"Sin Filtrar", match:["PET Sin Filtrar","Vidrio Sin Filtrar","Monodosis AOVE"] },
  { label:"Verde Oleum", match:["Verde Oleum"] },
  { label:"Delirium", match:["Delirium"] },
  { label:"Monodosis", match:["Monodosis AOVE"] },
];
