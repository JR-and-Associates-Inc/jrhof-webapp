import Image from 'next/image';

export default function AboutPage() {
  return (
    <>
      <main className="main-content container mx-auto px-2 sm:px-4 lg:px-6 py-6 overflow-x-hidden">
        <div className="w-full max-w-screen-xl mx-auto bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-6 lg:px-8 py-6">
          <section id="about" className="text-center space-y-3 text-base sm:text-lg">
            <h2 className="text-3xl sm:text-4xl font-bold">The Joe Rossi Hall of Fame</h2>
            <p>
              The <strong>Joe Rossi Hall of Fame</strong> honors the individuals whose dedication, hard work, and contributions have made a lasting impact on the game of baseball. Founded in 1989, the Hall of Fame was established to recognize the lifelong contributions of Joe Rossi — a living legend whose leadership and passion helped shape the landscape of high school umpiring in Colorado.
            </p>
          </section>

          <section id="mission" className="space-y-2 py-4 text-base sm:text-lg">
            <h2 className="text-2xl sm:text-3xl font-bold">Mission Statement</h2>
            <p>
              Our mission is to recognize and celebrate the outstanding achievements of individuals who have made a difference in the field of high school umpiring. By honoring these individuals, we aim to inspire and encourage the next generation of leaders, mentors, and change-makers.
            </p>
          </section>

          <section id="legacy" className="space-y-2 py-4 text-base sm:text-lg">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Image
                src="/images/joe_rossi_first_pitch.jpeg"
                alt="Joe Rossi throws the first pitch at a Rockies game"
                width={800}
                height={600}
                className="w-full md:w-auto md:max-w-md lg:max-w-lg max-h-[600px] object-cover rounded-lg shadow-lg self-center"
              />
              <div className="w-full md:w-1/2 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold">History</h2>
                <p>
                  <strong>Joe Rossi</strong> is a leader, mentor, and icon in Colorado high school baseball. This photo captures him throwing the ceremonial first pitch at a Rockies game — a tribute to his decades of service and influence in the sport. His continued involvement remains a cornerstone of our community today.
                </p>
                <p>
                  The Joe Rossi Hall of Fame was created in 1989 to preserve the legacy of those who have excelled in high school umpiring. Over the years, it has grown to include dozens of influential figures who have significantly contributed to the community.
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold">Inductees</h2>
                <p>
                  Inductees into the Joe Rossi Hall of Fame are chosen based on their outstanding contributions to high school umpiring. Each inductee has demonstrated exceptional leadership, dedication, and a lasting impact on the community.
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold">Impact & Community</h2>
                <p>
                  The Joe Rossi Hall of Fame is more than just a place of recognition—it&#39;s a community. We strive to support the next generation by providing scholarships, mentorship, and opportunities to aspiring umpires. Our annual fundraising events, including the golf tournament, help fund these efforts, and we are proud of the lasting impact we&#39;ve had on the community.
                </p>
              </div>
            </div>
          </section>

          <section id="future" className="space-y-2 py-4 text-base sm:text-lg">
            <h2 className="text-2xl sm:text-3xl font-bold">Looking Ahead</h2>
            <p>
              Looking to the future, we are committed to expanding the Hall of Fame and honoring even more exceptional individuals. Our goals include growing our scholarship programs and increasing the number of individuals recognized for their contributions to the sport.
            </p>
          </section>

          <section id="get-involved" className="space-y-2 py-4 text-base sm:text-lg">
            <h2 className="text-2xl sm:text-3xl font-bold">Get Involved</h2>
            <p>
              We invite you to be part of the Joe Rossi Hall of Fame legacy. Your support can help us continue to recognize outstanding individuals and inspire future generations. Whether through donations, volunteering, or attending our events, your involvement makes a difference.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}