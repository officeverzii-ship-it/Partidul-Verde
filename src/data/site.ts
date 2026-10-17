export const siteConfig = {
 name: 'Partidul Verde (Verzii)', tagline: 'VERZII · ROMÂNIA',
 description: 'România sănătoasă. Partidul Verde (Verzii), membru al Verzilor Europeni.',
 email: 'contact@partidulverde.ro', phone: '0746 080 853',
 address: 'Strada Mihai Eminescu 19–21, Sector 1, București 010512, etaj 1, camera 102',
};
export const aboutLinks = [
 {label:'Biroul Permanent Național',to:'/echipa'},
 {label:'Carta Verzilor Europeni',to:'/despre-noi/$slug',slug:'carta-verzilor-europeni'},
 {label:'Comunitatea Verde',to:'/despre-noi/$slug',slug:'comunitatea-verde'},
 {label:'Filiale județene',to:'/filiale'},
 {label:'Programul politic',to:'/despre-noi/$slug',slug:'romania-sanatoasa-noul-program-politic-al-partidului-verde'},
 {label:'Statut',to:'/despre-noi/$slug',slug:'statut'},
] as const;
export const visionTopics = [
 ['democratie-deplina','Democrație deplină','Instituții eficiente și responsabile'],
 ['mediu-curat','Mediu curat','Apă, aer, soluri de calitate'],
 ['politica-energetica','Schimbări climatice','Revenirea la un ritm înțelept'],
 ['economie-verde','Economie verde','În serviciul tranziției verzi'],
 ['munca-decenta','Muncă decentă','Fără sărăcie!'],
 ['digitalizare','Digitalizare','Sursă de competitivitate'],
 ['sanatate','Sănătate pentru toți','Pentru toți'],
 ['educatie-pentru-viitor','Educație pentru viitor','Cultivarea spiritului critic'],
 ['copiii-si-tinerii','Copiii și tinerii','În centrul acțiunilor noastre'],
 ['cultura-si-sport','Cultura, turism și sport','Motoare de creștere sustenabilă'],
 ['comunitati-durabile','Comunități durabile','Bunăstare!'],
] as const;
export const mainNav = [{label:'Despre noi',to:'/despre'},{label:'Viziune',to:'/viziune'},{label:'Media',to:'/media'},{label:'Contact',to:'/contact'}] as const;
export const footerNav = [
 {title:'Partidul Verde',links:[{label:'Despre noi',to:'/despre'},{label:'Viziune',to:'/viziune'},{label:'Filiale județene',to:'/filiale'}]},
 {title:'Implică-te',links:[{label:'Înscriere',to:'/inscriere'},{label:'Donează',to:'/doneaza'},{label:'Newsletter',to:'/newsletter-2'}]},
 {title:'Informații',links:[{label:'Confidențialitate',to:'/confidentialitate'},{label:'Termeni și condiții',to:'/termeni-si-conditii'},{label:'Impressum',to:'/impressum'}]},
] as const;
