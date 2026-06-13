import Link from "next/link";
import { ProjectPublic } from "@/types";
import { Badge, ProjectStatusBadge } from "@/components/ui/Badge";
import styles from "./ProjectCard.module.css";

interface ProjectCardProps {
  project: ProjectPublic;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isFeatured = (project as any).isFeatured === true;

  return (
    <Link
      href={`/showcase/${project.id}`}
      className={`${styles.card} ${isFeatured ? styles.featured : ""}`}
      id={`project-${project.id}`}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{project.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isFeatured && (
              <Badge variant="gold" size="sm">🏆 Destaque</Badge>
            )}
            {(project as any).isDemo && (
              <Badge variant="accent" size="sm">💡 Demo</Badge>
            )}
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {project.visibility === "private" && (
            <Badge variant="info" size="sm">🔒 Private</Badge>
          )}
          {(project as any).isStealth && (
            <Badge variant="warning" size="sm">🕵️ Stealth</Badge>
          )}
        </div>
      </div>

      <p className={styles.description}>{project.description}</p>

      <div className={styles.meta}>
        <div className={styles.tags}>
          {project.techStack.slice(0, 4).map((tech) => (
            <Badge key={tech} variant="primary" size="sm">{tech}</Badge>
          ))}
        </div>
        <div className={styles.tags}>
          {project.helpTypes.slice(0, 2).map((type) => (
            <Badge key={type} variant="accent" size="sm">{type}</Badge>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.niche}>#{project.niche}</span>
        <span className={styles.views}>👁 {project.viewCount}</span>
      </div>

      <div className={styles.arrow} aria-hidden="true">→</div>
    </Link>
  );
}
