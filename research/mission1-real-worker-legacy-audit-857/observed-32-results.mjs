/** P857 observed public 32-photo development inference results, NOT human truth.
 * Source: original GitHub Actions #43372968710 artifact #14013321896.
 * Raw original results.json SHA-256:
 * 087e5fe823adc8a04e5cb98e4e06182c9ee9e3a6b1896f64302319406983b8fb
 * Original artifact ZIP SHA-256:
 * 6785d5b4e891aeb4b7a528179ba4ccadd82651d39444ee2d4b9440384d1d63a4
 * Extract ONLY 5 fields per publicly exposed result: id, category, subtype,
 * strong, categoryConfirmed. 32/32 original inference rows had no runtime error.
 * Never substitute these for sealed human annotations or model improvement.
 */
export const ORIGINAL_RUN_857=Object.freeze({
 runId:43372968710, artifactId:14013321896,
 originalHead:'12aba9b54d18b2da384781c005dfad13fd688410',
 originalResultsJsonSha256:'087e5fe823adc8a04e5cb98e4e06182c9ee9e3a6b1896f64302319406983b8fb',
 originalArtifactZipSha256:'6785d5b4e891aeb4b7a528179ba4ccadd82651d39444ee2d4b9440384d1d63a4',
 humanGroundTruth:false, sealedBlind:false, realModelDefaultPath:true, independentAccuracy:null
});
const frozenRows=[
 ["commons-0001","Tops","T-shirt",true,false],
 ["commons-0002","Tops","T-shirt",true,false],
 ["commons-0021","Bottoms","Jeans",true,false],
 ["commons-0023","Bottoms","Jeans",true,false],
 ["commons-0024","Bottoms","Jeans",true,false],
 ["commons-0033","Bottoms","Shorts",true,false],
 ["commons-0035","Bottoms","Shorts",true,false],
 ["commons-0041","Bottoms","Skirt",true,false],
 ["commons-0043","Bottoms","Skirt",true,false],
 ["commons-0044","Bottoms","Skirt",true,false],
 ["commons-0045","Bottoms","Skirt",true,false],
 ["commons-0052","Dresses","Unknown",false,true],
 ["commons-0053","Dresses","Casual dress",true,false],
 ["commons-0064","Outerwear","Unknown",false,true],
 ["commons-0065","Outerwear","Jacket",true,false],
 ["commons-0067","Outerwear","Coat",true,false],
 ["commons-0068","Outerwear","Coat",true,false],
 ["commons-0069","Outerwear","Coat",true,false],
 ["commons-0070","Outerwear","Coat",true,false],
 ["commons-0079","Shoes","Sneakers",true,false],
 ["commons-0080","Shoes","Sneakers",true,false],
 ["commons-0081","Shoes","Sneakers",true,false],
 ["commons-0082","Shoes","Sneakers",true,false],
 ["commons-0083","Shoes","Sneakers",true,false],
 ["commons-0084","Shoes","Sneakers",true,false],
 ["commons-0085","Shoes","Sneakers",true,false],
 ["commons-0087","Shoes","Tall boots",true,false],
 ["commons-0088","Shoes","Unknown",false,true],
 ["commons-0089","Shoes","Unknown",false,true],
 ["commons-0092","Shoes","Unknown",false,true],
 ["commons-0093","Shoes","Unknown",false,true],
 ["commons-0094","Shoes","Unknown",false,true],
];
export const OBSERVED_32_857=Object.freeze(frozenRows.map(([id,category,type,strong,categoryConfirmed])=>
 Object.freeze({id,prediction:Object.freeze({category,type}),strong,categoryConfirmed})));
