import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {asset} from '../lib/content';
export default function Markdown({children,card=false}:{children:string;card?:boolean}){
 return <div className="editorial-copy"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{a:({href,children})=>card?<span>{children}</span>:<a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>,img:({src,alt})=>card?null:<img src={asset(src??'')} alt={alt??''} loading="lazy"/>,h1:({children})=><h4>{children}</h4>,h2:({children})=><h4>{children}</h4>,h3:({children})=><h4>{children}</h4>,input:()=>null}}>{children}</ReactMarkdown></div>;
}
