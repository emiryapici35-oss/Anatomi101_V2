import { expandedAnatomyItems } from "./expanded-anatomy";

export type SystemId="bones"|"joints"|"muscles"|"nervous"|"circulatory"|"respiratory"|"digestive"|"urinary"|"genital"|"endocrine"|"sensory";
export type AnatomyItem={id:string;latin:string;turkish:string;category:SystemId;group:string;note:string;accent:"coral"|"blue"|"mint";aliases:string[];x:number;y:number};
type Row=[string,string,string,number,number,string[]?];
const accent:Record<SystemId,AnatomyItem["accent"]>={bones:"blue",joints:"blue",muscles:"mint",nervous:"mint",circulatory:"coral",respiratory:"mint",digestive:"coral",urinary:"blue",genital:"coral",endocrine:"mint",sensory:"blue"};
const make=(category:SystemId,group:string,rows:Row[]):AnatomyItem[]=>rows.map(([id,latin,turkish,x,y,aliases=[]])=>({id,latin,turkish,category,group,note:`${turkish}, ${group.toLocaleLowerCase("tr-TR")} içinde öğrenilecek temel anatomik yapılardan biridir.`,accent:accent[category],aliases,x,y}));
const sideAdjective=(latin:string,left:boolean)=>{const first=latin.trim().split(/\s+/)[0].toLocaleLowerCase("la");if(["os","femur","corpus","ligamentum","ovarium","atrium","septum","crus","labium","vestibulum"].includes(first))return left?"sinistrum":"dextrum";if(["articulatio","arteria","vena","glandula","tuba","pleura","auricula","retina","cochlea","capsula","concha","costa","clavicula","scapula","maxilla","mandibula","patella","tibia","fibula","ulna","phalanx"].includes(first))return left?"sinistra":"dextra";return left?"sinister":"dexter"};
const pair=(category:SystemId,group:string,id:string,latin:string,turkish:string,x:number,y:number,aliases:string[]=[]):AnatomyItem[]=>[false,true].map((left,index)=>({id:`${id}-${left?"sinister":"dexter"}`,latin:`${latin} ${sideAdjective(latin,left)}`,turkish:`${left?"Sol":"Sağ"} ${turkish}`,category,group,note:`${left?"Sol":"Sağ"} ${turkish}, ${group.toLocaleLowerCase("tr-TR")} içinde yer alır.`,accent:accent[category],aliases,x:index?100-x:x,y}));
const range=(category:SystemId,group:string,prefix:string,latin:string,turkish:string,count:number,x:number,y:number)=>Array.from({length:count},(_,i)=>make(category,group,[[`${prefix}-${i+1}`,`${latin} ${i+1}`,`${turkish} ${i+1}`,x,y+(i-(count-1)/2)*.7]])[0]);
const rangeFrom=(category:SystemId,group:string,prefix:string,latin:string,turkish:string,start:number,count:number,x:number,y:number)=>Array.from({length:count},(_,i)=>make(category,group,[[`${prefix}-${i+1}`,`${latin} ${i+start}`,`${turkish} ${i+start}`,x,y+(i-(count-1)/2)*.7]])[0]);
const bilateralRange=(group:string,prefix:string,latin:string,turkish:string,count:number,x:number,y:number)=>[false,true].flatMap((left,index)=>Array.from({length:count},(_,i)=>make("bones",group,[[`${prefix}-${left?"sinister":"dexter"}-${i+1}`,`${latin} ${i+1} ${sideAdjective(latin,left)}`,`${left?"Sol":"Sağ"} ${turkish} ${i+1}`,index?100-x:x,y+(i-(count-1)/2)*.55]])[0]));
const romanNumerals=["I","II","III","IV","V"];
const handDigits=[
 {id:"pollicis",latin:"pollicis",turkish:"başparmak",segments:[["proximalis","proksimal"],["distalis","distal"]]},
 {id:"indicis",latin:"digiti indicis",turkish:"işaret parmağı",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
 {id:"medii",latin:"digiti medii",turkish:"orta parmak",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
 {id:"anularis",latin:"digiti anularis",turkish:"yüzük parmağı",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
 {id:"minimi",latin:"digiti minimi",turkish:"küçük parmak",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
] as const;
const footDigits=[
 {id:"hallucis",latin:"hallucis",turkish:"ayak başparmağı",segments:[["proximalis","proksimal"],["distalis","distal"]]},
 {id:"secundi",latin:"digiti secundi",turkish:"ayak ikinci parmağı",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
 {id:"tertii",latin:"digiti tertii",turkish:"ayak üçüncü parmağı",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
 {id:"quarti",latin:"digiti quarti",turkish:"ayak dördüncü parmağı",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
 {id:"quinti",latin:"digiti quinti",turkish:"ayak küçük parmağı",segments:[["proximalis","proksimal"],["media","orta"],["distalis","distal"]]},
] as const;

// Adult human skeleton: 206 bones, including each paired, carpal, tarsal and phalangeal bone.
const skeleton:AnatomyItem[]=[
 ...make("bones","Kafa kemikleri",[["os-frontale","Os frontale","Alın kemiği",50,13],["os-occipitale","Os occipitale","Art kafa kemiği",50,14],["os-sphenoidale","Os sphenoidale","Kama kemiği",50,14],["os-ethmoidale","Os ethmoidale","Kalbur kemiği",50,14]]),
 ...pair("bones","Kafa kemikleri","os-parietale","Os parietale","Yan kafa kemiği",46,13),...pair("bones","Kafa kemikleri","os-temporale","Os temporale","Şakak kemiği",43,16),
 ...pair("bones","Yüz kemikleri","os-nasale","Os nasale","Burun kemiği",48,15),...pair("bones","Yüz kemikleri","maxilla","Maxilla","Üst çene kemiği",47,17),...pair("bones","Yüz kemikleri","os-zygomaticum","Os zygomaticum","Elmacık kemiği",44,17),...pair("bones","Yüz kemikleri","os-palatinum","Os palatinum","Damak kemiği",48,18),...pair("bones","Yüz kemikleri","os-lacrimale","Os lacrimale","Gözyaşı kemiği",46,16),...pair("bones","Yüz kemikleri","concha-nasalis-inferior","Concha nasalis inferior","Alt burun konkası",47,16),...make("bones","Yüz kemikleri",[["vomer","Vomer","Sapan kemiği",50,16],["mandibula","Mandibula","Alt çene kemiği",50,19]]),
 ...pair("bones","İşitme kemikçikleri","malleus","Malleus","Çekiç kemiği",43,17),...pair("bones","İşitme kemikçikleri","incus","Incus","Örs kemiği",43,17),...pair("bones","İşitme kemikçikleri","stapes","Stapes","Üzengi kemiği",43,17),...make("bones","Boyun",[["os-hyoideum","Os hyoideum","Dil kemiği",50,21]]),
 ...make("bones","Omurga",[["atlas","Atlas (C1)","Atlas omuru",50,21],["axis","Axis (C2)","Axis omuru",50,22]]),...rangeFrom("bones","Omurga","vertebra-cervicalis","Vertebra cervicalis","Boyun omuru",3,5,50,23),...range("bones","Omurga","vertebra-thoracica","Vertebra thoracica","Göğüs omuru",12,50,31),...range("bones","Omurga","vertebra-lumbalis","Vertebra lumbalis","Bel omuru",5,50,45),...make("bones","Omurga",[["os-sacrum","Os sacrum","Sakrum",50,54],["coccyx","Coccyx","Koksiks",50,57]]),
 ...make("bones","Göğüs kafesi",[["sternum","Sternum","Göğüs kemiği",50,28]]),...bilateralRange("Göğüs kafesi","costa","Costa","Kaburga",12,44,30),
 ...pair("bones","Omuz kuşağı","clavicula","Clavicula","Köprücük kemiği",44,24),...pair("bones","Omuz kuşağı","scapula","Scapula","Kürek kemiği",39,26),
 ...pair("bones","Üst ekstremite","humerus","Humerus","Üst kol kemiği",34,34),...pair("bones","Üst ekstremite","radius","Radius","Işın kemiği",30,43),...pair("bones","Üst ekstremite","ulna","Ulna","Dirsek kemiği",35,43),
 ...["scaphoideum","lunatum","triquetrum","pisiforme","trapezium","trapezoideum","capitatum","hamatum"].flatMap((name,i)=>pair("bones","El bileği kemikleri",`os-carpi-${i+1}`,`Os ${name}`,`${name} el bilek kemiği`,28,49+i*.25)),
 ...romanNumerals.flatMap((number,index)=>pair("bones","El tarak kemikleri",`os-metacarpale-${index+1}`,`Os metacarpale ${number}`,`${index+1}. el tarak kemiği`,27,53)),
 ...handDigits.flatMap((digit,digitIndex)=>digit.segments.flatMap(([latinSegment,turkishSegment],segmentIndex)=>pair("bones","El parmak kemikleri",`phalanx-manus-${digitIndex+1}-${segmentIndex+1}`,`Phalanx ${latinSegment} ${digit.latin}`,`${digit.turkish} ${turkishSegment} falanksı`,26,56+digitIndex*.3))),
 ...pair("bones","Pelvis","os-coxae","Os coxae","Kalça kemiği",45,55),...pair("bones","Alt ekstremite","femur","Femur","Uyluk kemiği",43,65),...pair("bones","Alt ekstremite","patella","Patella","Diz kapağı",43,74),...pair("bones","Alt ekstremite","tibia","Tibia","Kaval kemiği",42,82),...pair("bones","Alt ekstremite","fibula","Fibula","Kamış kemiği",47,82),
 ...[["Talus","Aşık kemiği"],["Calcaneus","Topuk kemiği"],["Os naviculare","Ayak kayık kemiği"],["Os cuboideum","Küboid kemik"],["Os cuneiforme mediale","İç kama kemiği"],["Os cuneiforme intermedium","Orta kama kemiği"],["Os cuneiforme laterale","Dış kama kemiği"]].flatMap(([latin,turkish],i)=>pair("bones","Ayak bileği kemikleri",`os-tarsi-${i+1}`,latin,turkish,42,90+i*.2)),
 ...romanNumerals.flatMap((number,index)=>pair("bones","Ayak tarak kemikleri",`os-metatarsale-${index+1}`,`Os metatarsale ${number}`,`${index+1}. ayak tarak kemiği`,42,94)),
 ...footDigits.flatMap((digit,digitIndex)=>digit.segments.flatMap(([latinSegment,turkishSegment],segmentIndex)=>pair("bones","Ayak parmak kemikleri",`phalanx-pedis-${digitIndex+1}-${segmentIndex+1}`,`Phalanx ${latinSegment} ${digit.latin}`,`${digit.turkish} ${turkishSegment} falanksı`,42,97+digitIndex*.2))),
];

const joints=make("joints","Baş ve omurga",[["art-temporomandibularis","Articulatio temporomandibularis","Çene eklemi",50,18],["art-atlantooccipitalis","Articulatio atlantooccipitalis","Baş-boyun eklemi",50,21],["art-atlantoaxialis","Articulatio atlantoaxialis","Atlas-axis eklemi",50,22],["art-intervertebrales","Articulationes intervertebrales","Omurlar arası eklemler",50,38],["art-sacrococcygea","Articulatio sacrococcygea","Sakrokoksigeal eklem",50,57]]).concat(make("joints","Omuz ve üst ekstremite",[["art-sternoclavicularis","Articulatio sternoclavicularis","Sternoklavikular eklem",45,24],["art-acromioclavicularis","Articulatio acromioclavicularis","Akromioklavikular eklem",39,25],["art-humeri","Articulatio humeri","Omuz eklemi",34,29],["art-cubiti","Articulatio cubiti","Dirsek eklemi",31,40],["art-radiocarpalis","Articulatio radiocarpalis","El bileği eklemi",28,49],["art-metacarpophalangeae","Articulationes metacarpophalangeae","El tarak-parmak eklemleri",27,54],["art-interphalangeae-manus","Articulationes interphalangeae manus","El parmak eklemleri",26,57]])).concat(make("joints","Pelvis ve alt ekstremite",[["art-sacrioiliaca","Articulatio sacroiliaca","Sakroiliak eklem",47,55],["art-coxae","Articulatio coxae","Kalça eklemi",43,59],["art-genus","Articulatio genus","Diz eklemi",43,74],["art-tibiofibularis","Articulatio tibiofibularis","Tibia-fibula eklemi",45,80],["art-talocruralis","Articulatio talocruralis","Ayak bileği eklemi",43,90],["art-subtalaris","Articulatio subtalaris","Subtalar eklem",43,91],["art-tarsometatarsales","Articulationes tarsometatarsales","Ayak tarak eklemleri",43,94],["art-interphalangeae-pedis","Articulationes interphalangeae pedis","Ayak parmak eklemleri",43,97]]) );
const muscles=make("muscles","Baş ve boyun",[["m-frontalis","Musculus frontalis","Alın kası",50,14],["m-orbicularis-oculi","Musculus orbicularis oculi","Göz çevresi kası",47,16],["m-masseter","Musculus masseter","Çiğneme kası",45,18],["m-sternocleidomastoideus","Musculus sternocleidomastoideus","Boyun döndürücü kas",47,21]]).concat(make("muscles","Gövde ve üst ekstremite",[["m-trapezius","Musculus trapezius","Trapez kası",42,25],["m-deltoideus","Musculus deltoideus","Deltoid kası",35,28],["m-pectoralis-major","Musculus pectoralis major","Büyük göğüs kası",45,33],["m-serratus-anterior","Musculus serratus anterior","Ön testere kası",40,39],["m-biceps-brachii","Musculus biceps brachii","Biseps kası",32,39],["m-triceps-brachii","Musculus triceps brachii","Triseps kası",35,39],["m-brachioradialis","Musculus brachioradialis","Ön kol kası",30,45],["m-rectus-abdominis","Musculus rectus abdominis","Düz karın kası",50,45],["m-obliquus-externus","Musculus obliquus externus","Dış oblik kas",42,46]])).concat(make("muscles","Pelvis ve alt ekstremite",[["m-gluteus-maximus","Musculus gluteus maximus","Büyük kalça kası",47,57],["m-adductor-longus","Musculus adductor longus","Uzun yaklaştırıcı kas",45,64],["m-quadriceps-femoris","Musculus quadriceps femoris","Kuadriseps kası",42,66],["m-biceps-femoris","Musculus biceps femoris","Arka uyluk kası",46,67],["m-tibialis-anterior","Musculus tibialis anterior","Ön kaval kası",42,81],["m-gastrocnemius","Musculus gastrocnemius","İkiz baldır kası",47,84],["m-soleus","Musculus soleus","Yassı baldır kası",46,86]]) );
const systemsData:AnatomyItem[]=[
 ...make("nervous","Merkezi sinir sistemi",[["encephalon","Encephalon","Beyin",50,14],["cerebrum","Cerebrum","Büyük beyin",50,14],["cerebellum","Cerebellum","Beyincik",52,17],["truncus-encephali","Truncus encephali","Beyin sapı",50,19],["medulla-spinalis","Medulla spinalis","Omurilik",50,39]]),...make("nervous","Periferik sinir sistemi",[["nervus-vagus","Nervus vagus","Vagus siniri",48,30],["plexus-brachialis","Plexus brachialis","Brakiyal pleksus",38,27],["nervus-medianus","Nervus medianus","Median sinir",31,43],["nervus-ulnaris","Nervus ulnaris","Ulnar sinir",35,43],["nervus-ischiadicus","Nervus ischiadicus","Siyatik sinir",44,65],["nervus-femoralis","Nervus femoralis","Femoral sinir",43,64],["nervus-tibialis","Nervus tibialis","Tibial sinir",43,83]]),
 ...make("circulatory","Kalp",[["cor","Cor","Kalp",50,37],["aorta","Aorta","Aort",50,34],["vena-cava-superior","Vena cava superior","Üst ana toplardamar",50,28],["vena-cava-inferior","Vena cava inferior","Alt ana toplardamar",50,49],["arteria-pulmonalis","Arteria pulmonalis","Akciğer atardamarı",48,35],["venae-pulmonales","Venae pulmonales","Akciğer toplardamarları",52,35]]),...make("circulatory","Büyük dolaşım damarları",[["arteria-carotis","Arteria carotis communis","Şah damarı",48,23],["arteria-subclavia","Arteria subclavia","Köprücük altı atardamarı",40,25],["arteria-brachialis","Arteria brachialis","Kol atardamarı",34,37],["arteria-radialis","Arteria radialis","Işın atardamarı",30,45],["arteria-femoralis","Arteria femoralis","Uyluk atardamarı",43,65],["arteria-tibialis","Arteria tibialis","Kaval atardamarı",43,82]]),
 ...make("respiratory","Üst solunum yolları",[["cavitas-nasi","Cavitas nasi","Burun boşluğu",50,16],["pharynx","Pharynx","Yutak",50,20],["larynx","Larynx","Gırtlak",50,23],["trachea","Trachea","Soluk borusu",50,28]]),...make("respiratory","Alt solunum yolları",[["bronchi","Bronchi","Bronşlar",50,32],["pulmo-dexter","Pulmo dexter","Sağ akciğer",43,35],["pulmo-sinister","Pulmo sinister","Sol akciğer",57,35],["pleura","Pleura","Akciğer zarı",43,35],["diaphragma","Diaphragma","Diyafram",50,42]]),
 ...make("digestive","Ağız ve yutak",[["lingua","Lingua","Dil",50,18],["glandula-parotis","Glandula parotis","Parotis bezi",44,18],["oesophagus","Oesophagus","Yemek borusu",50,31]]),...make("digestive","Karın organları",[["hepar","Hepar","Karaciğer",43,47],["vesica-biliaris","Vesica biliaris","Safra kesesi",45,49,["Vesica fellea"]],["ventriculus","Ventriculus","Mide",56,48],["pancreas","Pancreas","Pankreas",53,52],["lien","Lien","Dalak",61,48],["intestinum-tenue","Intestinum tenue","İnce bağırsak",50,58],["intestinum-crassum","Intestinum crassum","Kalın bağırsak",50,60],["rectum","Rectum","Rektum",50,66]]),
 ...make("urinary","Böbrek ve idrar yolları",[["ren-dexter","Ren dexter","Sağ böbrek",42,51],["ren-sinister","Ren sinister","Sol böbrek",58,51],["ureter-dexter","Ureter dexter","Sağ üreter",45,60],["ureter-sinister","Ureter sinister","Sol üreter",55,60],["vesica-urinaria","Vesica urinaria","Mesane",50,66],["urethra","Urethra","Üretra",50,69]]),
 ...make("genital","Kadın üreme sistemi",[["ovarium-dexter","Ovarium dexter","Sağ yumurtalık",43,65],["ovarium-sinister","Ovarium sinister","Sol yumurtalık",57,65],["tuba-uterina","Tuba uterina","Fallop tüpü",45,64],["uterus","Uterus","Rahim",50,67],["vagina","Vagina","Vajina",50,70]]),...make("genital","Erkek üreme sistemi",[["testis-dexter","Testis dexter","Sağ testis",47,75],["testis-sinister","Testis sinister","Sol testis",53,75],["epididymis","Epididymis","Epididim",47,74],["prostata","Prostata","Prostat",50,69],["penis","Penis","Penis",50,73]]),
 ...make("endocrine","Endokrin bezler",[["hypophysis","Hypophysis","Hipofiz bezi",50,14],["epiphysis","Epiphysis","Epifiz bezi",50,14],["glandula-thyroidea","Glandula thyroidea","Tiroid bezi",50,22],["glandula-parathyroidea","Glandula parathyroidea","Paratiroid bezleri",50,22],["thymus","Thymus","Timus",50,31],["glandula-suprarenalis","Glandula suprarenalis","Böbreküstü bezleri",42,49],["insulae-pancreaticae","Insulae pancreaticae","Pankreas adacıkları",53,52]]),
 ...make("sensory","Görme",[["bulbus-oculi","Bulbus oculi","Göz küresi",46,16],["retina","Retina","Retina",46,16],["nervus-opticus","Nervus opticus","Görme siniri",48,16]]),...make("sensory","İşitme ve denge",[["auris-externa","Auris externa","Dış kulak",43,17],["cochlea","Cochlea","Koklea",43,17],["vestibulum","Vestibulum","Vestibül",43,17]]),...make("sensory","Koku, tat ve dokunma",[["organum-olfactus","Organum olfactus","Koku organı",50,15],["papillae-linguales","Papillae linguales","Tat tomurcukları",50,18],["cutis","Cutis","Deri",40,45]]),
];
if (skeleton.length !== 206) throw new Error(`İskelet veri bütünlüğü hatası: 206 yerine ${skeleton.length} kemik üretildi.`);
const reviewedTerms: Record<string, Partial<AnatomyItem>> = {
 "papillae-linguales": { turkish: "Dil papillaları", note: "Dilin yüzeyindeki papiller çıkıntılardır. Tat tomurcukları bazı papilla tiplerinin epitelinde bulunur; papillalar ile tat tomurcukları aynı yapı değildir." },
 "ovarium-dexter": { latin: "Ovarium dextrum" },
 "ovarium-sinister": { latin: "Ovarium sinistrum" },
 "larynx": { group: "Alt solunum yolları" },
 "trachea": { group: "Alt solunum yolları" },
 "arteria-tibialis": { latin: "Arteria tibialis anterior", turkish: "Ön tibial arter", note: "Popliteal arterin terminal dallarından biridir; bacağın ön kompartımanına ilerler ve ayak sırtında arteria dorsalis pedis olarak devam eder." },
};
const combinedItems:AnatomyItem[]=[...skeleton,...joints,...muscles,...systemsData,...expandedAnatomyItems].map(item => ({ ...item, ...reviewedTerms[item.id] }));
const canonicalLatin=(value:string)=>value.toLocaleLowerCase("la").replace(/\s+/g," ").trim();
const seenStructures=new Set<string>();
export const anatomyItems=combinedItems.filter(item=>{
 const key=`${item.category}:${canonicalLatin(item.latin)}`;
 if(seenStructures.has(key))return false;
 seenStructures.add(key);
 return true;
});
export const catalogCounts=Object.fromEntries((["bones","joints","muscles","nervous","circulatory","respiratory","digestive","urinary","genital","endocrine","sensory"] as SystemId[]).map(category=>[category,anatomyItems.filter(item=>item.category===category).length])) as Record<SystemId,number>;
export const catalogVersion="2026.10";
export function validateAnatomyCatalog(){
 const issues:string[]=[];
 const ids=new Set<string>();
 const terms=new Set<string>();
 for(const item of anatomyItems){
  if(!item.id||!item.latin||!item.turkish||!item.group||!item.note)issues.push(`Eksik zorunlu alan: ${item.id||"kimliksiz kayıt"}`);
  if(ids.has(item.id))issues.push(`Yinelenen kimlik: ${item.id}`); else ids.add(item.id);
  const termKey=`${item.category}:${canonicalLatin(item.latin)}`;
  if(terms.has(termKey))issues.push(`Yinelenen terim: ${termKey}`); else terms.add(termKey);
  if(!Number.isFinite(item.x)||!Number.isFinite(item.y)||item.x<0||item.x>100||item.y<0||item.y>100)issues.push(`Geçersiz koordinat: ${item.id}`);
 }
 if(catalogCounts.bones!==206)issues.push(`Yetişkin iskeleti 206 yerine ${catalogCounts.bones} kemik içeriyor.`);
 return issues;
}
const catalogIssues=validateAnatomyCatalog();
if(catalogIssues.length)throw new Error(`Anatomi kataloğu doğrulanamadı:\n${catalogIssues.join("\n")}`);
export const systems=[
 {id:"bones",name:"Kemikler",description:"206 yetişkin kemiği",icon:"bone"},
 {id:"joints",name:"Eklemler",description:"Sınıflama ve bölgesel öğrenme",icon:"joint"},
 {id:"muscles",name:"Kaslar",description:`${catalogCounts.muscles} taraf ve alt bölüm`,icon:"muscle"},
 {id:"nervous",name:"Sinir sistemi",description:"MSS, PSS ve otonom sistem",icon:"brain"},
 {id:"circulatory",name:"Dolaşım sistemi",description:"Kalp, arter ve venler",icon:"heart"},
 {id:"respiratory",name:"Solunum sistemi",description:"Üst-alt yollar ve segmentler",icon:"lungs"},
 {id:"digestive",name:"Sindirim sistemi",description:"Kanal, bezler ve periton",icon:"digestive"},
 {id:"urinary",name:"Üriner sistem",description:"Böbrekten üretraya",icon:"kidney"},
 {id:"genital",name:"Genital sistem",description:"Kadın ve erkek alt yapıları",icon:"reproductive"},
 {id:"endocrine",name:"Endokrin sistem",description:"Bezler, zonlar ve hücreler",icon:"endocrine"},
 {id:"sensory",name:"Duyu organları",description:"Görme, işitme, tat ve deri",icon:"eye"},
] as const;
export function normalize(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("tr-TR").replaceAll("ı","i").replaceAll("ş","s").replaceAll("ğ","g").replaceAll("ü","u").replaceAll("ö","o").replaceAll("ç","c").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim()}
