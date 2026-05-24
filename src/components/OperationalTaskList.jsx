import { useNavigate } from "react-router-dom";
import { RETAIL_THEME } from "../config/retailTheme";

const C = RETAIL_THEME.colors;

export default function OperationalTaskList({ title = "Operational tasks", tasks = [] }) {
  const navigate = useNavigate();

  const priorityColor = (task) => {
    if (task.priority === "high") return C.error;
    if (task.priority === "medium") return C.warn;
    return C.muted;
  };

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: RETAIL_THEME.radius.lg, boxShadow: RETAIL_THEME.shadows.card, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>{title}</div>
      {tasks.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>No pending operational tasks.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {tasks.map((task) => {
            const content = (
              <>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, lineHeight: 1.5 }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginTop: 4 }}>{task.description}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: "uppercase", letterSpacing: ".08em" }}>{task.section}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: priorityColor(task), textTransform: "uppercase", letterSpacing: ".08em" }}>{task.priority}</span>
                  {task.blocking && <span style={{ fontSize: 10, fontWeight: 800, color: C.error, textTransform: "uppercase", letterSpacing: ".08em" }}>blocking</span>}
                  {task.dueState && <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{task.dueState.replaceAll("_", " ")}</span>}
                </div>
              </>
            );

            const isClickable = Boolean(task.link?.path);
            const Wrapper = isClickable ? "button" : "div";
            return (
              <Wrapper
                key={task.id}
                type={isClickable ? "button" : undefined}
                onClick={isClickable ? () => navigate(task.link.path) : undefined}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 14,
                  background: C.offWhite,
                  border: `1px solid ${C.border}`,
                  borderRadius: RETAIL_THEME.radius.sm,
                  padding: 14,
                  textAlign: "left",
                  width: "100%",
                  borderStyle: "solid",
                  backgroundColor: C.offWhite,
                  appearance: "none",
                  cursor: isClickable ? "pointer" : "default",
                  color: "inherit",
                }}
              >
                {content}
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
