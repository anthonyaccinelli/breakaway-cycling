export const REPORT_MODES=['Classic','Survival','Cycle Quest'] as const;
export type ReportMode=typeof REPORT_MODES[number];
export type BugReport={trainer:string;browser:string;mode:ReportMode;description:string;build:string};
export function validateBugReport(input:Record<string,unknown>):BugReport{
 const text=(name:string,max:number)=>{const value=typeof input[name]==='string'?(input[name] as string).trim():'';if(!value||value.length>max)throw new Error('Please complete all four fields within their length limits.');return value;};
 const mode=text('mode',20);if(!REPORT_MODES.includes(mode as ReportMode))throw new Error('Please choose a game mode.');
 return {trainer:text('trainer',120),browser:text('browser',200),mode:mode as ReportMode,description:text('description',5000),build:text('build',100)};
}
export async function sendBugReport(input:Record<string,unknown>,url:string|undefined,key:string|undefined,request:typeof fetch=fetch):Promise<void>{
 const report=validateBugReport(input);
 if(!url||!key)throw new Error('Reporting is temporarily unavailable. Your report has been kept in the form.');
 const response=await request(new URL('/rest/v1/beta_bug_reports',url),{method:'POST',headers:{apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(report),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Could not send your report. Your text has been kept; please try again.');
}
