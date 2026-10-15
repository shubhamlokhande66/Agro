/** Field photographs and notes for each Crop Calendar phase. Photos are from Wikimedia Commons
 *  under Creative Commons licences (credited on the page) and served from /public/crop-stages. */

export type StagePhoto = {
  src: string;
  caption: string;
  place: string;
  /** credit line pieces — the licences require naming the author and licence with a link */
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export const STAGE_INFO: Record<string, { blurb: string; photo: StagePhoto }> = {
  land: {
    blurb: "Ploughing, harrowing and levelling ahead of the monsoon; farmyard manure goes in before sowing.",
    photo: {
      src: "/crop-stages/land.jpg",
      caption: "Bullock ploughing between cotton rows",
      place: "Chinawal, Maharashtra",
      author: "abhiriksh",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Farm_worker_ploughing_cotton_field.jpg",
    },
  },
  sow: {
    blurb: "Bt hybrid seed goes in with the monsoon's onset in central and south India; irrigated north India sows from late April.",
    photo: {
      src: "/crop-stages/sow.jpg",
      caption: "Treated Bt hybrid cotton seed",
      place: "Maharashtra",
      author: "Vikas Suroshe",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Seeds_of_cotton.jpg",
    },
  },
  veg: {
    blurb: "Seedlings establish and the canopy builds over 30–60 days; weeding and top-dressing matter most now.",
    photo: {
      src: "/crop-stages/veg.jpg",
      caption: "Bt cotton crop at full canopy",
      place: "Nagarjuna Sagar, Andhra Pradesh",
      author: "Bhaskaranaidu",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Cotton_crop_in_the_field.JPG",
    },
  },
  sq: {
    blurb: "Flower buds (squares) form 45–60 days after sowing, then flowering — the crop is most sensitive to dry spells and pink bollworm.",
    photo: {
      src: "/crop-stages/sq.jpg",
      caption: "Cotton flower and buds",
      place: "Chinawal, Maharashtra",
      author: "ABHIJEET",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Cotton_Flower_Chinawal_1.jpg",
    },
  },
  boll: {
    blurb: "Flowers set into green bolls that fill for 45–60 days; this is when yield and fibre quality are decided.",
    photo: {
      src: "/crop-stages/boll.jpg",
      caption: "Green boll filling",
      place: "Kandi, Benin",
      author: "ChriKo",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Cotton_boll.jpg",
    },
  },
  harv: {
    blurb: "Bolls burst open and the first hand-picking of kapas begins; arrivals at mandis start to build.",
    photo: {
      src: "/crop-stages/harv.jpg",
      caption: "First picking of open bolls",
      place: "Raichur, Karnataka",
      author: "Nanditha Gogate, WELL Labs",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Woman_picking_cotton_in_Raichur,_Karnataka.jpg",
    },
  },
  "2nd": {
    blurb: "Later bolls open on the drying crop for further pickings; yield and quality taper off.",
    photo: {
      src: "/crop-stages/2nd.jpg",
      caption: "Late-season crop ready for another picking",
      place: "Raichur, Karnataka",
      author: "Nabina Chakraborty, WELL Labs",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Closeup_image_of_a_cotton_field_in_Raichur_Karnataka.jpg",
    },
  },
  msp: {
    blurb: "Kapas reaches APMC yards and ginners; CCI steps in to buy at MSP when market prices fall below support.",
    photo: {
      src: "/crop-stages/msp.jpg",
      caption: "Kapas heaped at the cotton market",
      place: "Raichur, Karnataka",
      author: "Nanditha Gogate, WELL Labs",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Women_heaping_cotton_in_Raichur%27s_cotton_market.jpg",
    },
  },
};
