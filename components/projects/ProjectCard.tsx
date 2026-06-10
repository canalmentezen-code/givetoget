import Link from "next/link";
import { ProjectPublic } from "@/types";
import { Badge, ProjectStatusBadge } from "@/components/ui/Badge";
import styles from "./ProjectCard.module.css";

interface ProjectCardProps {
  project: ProjectPublic;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/showcase/${project.id}`} className={styles.card} id={`project-${project.id}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{project.name}</h3>
          <ProjectStatusBadge status={project.status} />
        </div>

        {project.visibility === "private" && (
          <Badge variant="info" size="sm">🔒 Private</Badge>
        )}
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
