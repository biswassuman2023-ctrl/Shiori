import { parseProseBody } from "@/types/lesson";
import type { InlineNode, ProseNode } from "@/types/content";
import type { BlockRendererProps } from "@/content/registry";

/**
 * Renders a `prose` block's body. `ProseNode[]` is a closed set of node
 * types stored as data (see docs/CONTENT-BIBLE.md) specifically so it can be
 * rendered without a Markdown parser or an HTML sanitiser in the bundle.
 */
export function ProseBlock({ block }: BlockRendererProps) {
  const body = parseProseBody(block.props);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-ink-secondary">
      {body.map((node, index) => (
        <ProseNodeView key={index} node={node} />
      ))}
    </div>
  );
}

function ProseNodeView({ node }: { node: ProseNode }) {
  switch (node.type) {
    case "paragraph":
      return (
        <p>
          <InlineNodes nodes={node.content} />
        </p>
      );
    case "heading": {
      const Tag = node.level === 2 ? "h2" : "h3";
      return (
        <Tag className="font-medium text-ink">
          <InlineNodes nodes={node.content} />
        </Tag>
      );
    }
    case "list": {
      const Tag = node.ordered ? "ol" : "ul";
      return (
        <Tag className={node.ordered ? "list-decimal pl-5" : "list-disc pl-5"}>
          {node.items.map((item, index) => (
            <li key={index}>
              <InlineNodes nodes={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "callout":
      return (
        <div className="rounded-card border border-border bg-canvas px-4 py-3 text-ink">
          <InlineNodes nodes={node.content} />
        </div>
      );
    case "example":
      return (
        <div className="rounded-card border border-border bg-surface px-4 py-3">
          <p lang="ja" className="text-lg">
            {node.japanese.map((segment, index) =>
              segment.ruby ? (
                <ruby key={index}>
                  {segment.text}
                  <rt>{segment.ruby}</rt>
                </ruby>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">{node.english}</p>
        </div>
      );
  }
}

function InlineNodes({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case "text":
            return <span key={index}>{node.value}</span>;
          case "emphasis":
            return (
              <em key={index} className="text-ink">
                {node.value}
              </em>
            );
          case "code":
            return (
              <code key={index} className="rounded-control bg-canvas px-1 py-0.5 font-mono text-sm">
                {node.value}
              </code>
            );
          case "japanese":
            return (
              <span key={index} lang="ja">
                {node.value.map((segment, segmentIndex) =>
                  segment.ruby ? (
                    <ruby key={segmentIndex}>
                      {segment.text}
                      <rt>{segment.ruby}</rt>
                    </ruby>
                  ) : (
                    <span key={segmentIndex}>{segment.text}</span>
                  ),
                )}
              </span>
            );
        }
      })}
    </>
  );
}
