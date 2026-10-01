import Link from "next/link";

const upper =
  "Blockchain · Robotics · Automation · Electrical Engineering · Software Systems · Applied AI · ";
const lower =
  "Frontend Development · Full-stack Development · Drone Systems · Product Engineering · Control Systems · ";

function RollingBand({
  text,
  direction,
}: {
  text: string;
  direction: "left" | "right";
}) {
  return (
    <div className="home-collaboration__band" aria-hidden="true">
      <div className="home-collaboration__track" data-direction={direction}>
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

export function RollingCollaboration() {
  return (
    <section
      className="home-collaboration"
      aria-labelledby="home-collaboration-title"
    >
      <RollingBand text={upper} direction="right" />
      <div className="home-collaboration__cta">
        <p>Got a problem worth building around?</p>
        <h2 id="home-collaboration-title">
          Interested in <span>collaboration</span>?
        </h2>
        <Link href="/contact">Let&apos;s talk</Link>
      </div>
      <RollingBand text={lower} direction="left" />
    </section>
  );
}
