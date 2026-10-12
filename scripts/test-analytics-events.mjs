// Acceptance tests for the analytics event names in the built site (docs/ANALYTICS.md).
// Run after `npm run build`; reads dist/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
assert.ok(fs.existsSync(dist), 'Run npm run build before the analytics event tests.');

const read = (relative) => fs.readFileSync(path.join(dist, relative), 'utf8');
const decode = (value) => value.replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&amp;', '&');
const anchors = (html) => [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => ({
  tag,
  href: tag.match(/\bhref="([^"]*)"/)?.[1],
  event: tag.match(/\bdata-ga-event="([^"]*)"/)?.[1],
  params: JSON.parse(decode(tag.match(/\bdata-ga-params="([^"]*)"/)?.[1] || '{}')),
}));
const block = (html, pattern, label, relative) => {
  const match = html.match(pattern);
  assert.ok(match, `${relative}: ${label} not found`);
  return match[0];
};

const pages = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (entry.name.endsWith('.html')) pages.push(path.relative(dist, filename));
  }
};
walk(dist);

// Header and footer links to /contact/ are navigation: nav_click with a link_context,
// never contact_click (which is reserved for real "contact us" calls to action).
for (const relative of pages) {
  const html = read(relative);
  const regions = [
    ['header_nav', block(html, /<nav class="site-nav"[\s\S]*?<\/nav>/, 'header navigation', relative)],
    ['footer_nav', block(html, /<footer class="site-footer"[\s\S]*?<\/footer>/, 'footer', relative)],
  ];
  for (const [context, region] of regions) {
    const contactLinks = anchors(region).filter((link) => link.href === '/contact/');
    assert.equal(contactLinks.length, 1, `${relative}: expected one ${context} link to /contact/`);
    for (const link of contactLinks) {
      assert.equal(link.event, 'nav_click', `${relative}: ${context} Contact link must send nav_click`);
      assert.equal(link.params.link_context, context, `${relative}: ${context} Contact link must set link_context`);
    }
    assert.ok(!anchors(region).some((link) => link.event === 'contact_click'), `${relative}: ${context} must not send contact_click`);
  }
}

// Real contact calls to action keep contact_click.
{
  const banquet = read('events/induction-banquet/2027-hall-of-fame-induction-banquet/index.html');
  const main = block(banquet, /<main[\s\S]*?<\/main>/, 'main', 'banquet page');
  assert.ok(anchors(main).some((link) => link.href === '/contact/' && link.event === 'contact_click'), 'The banquet "Contact the Hall of Fame" button must keep contact_click.');
}

// The /sponsor/ call to action sends sponsor_inquiry.
{
  const main = block(read('sponsor/index.html'), /<main[\s\S]*?<\/main>/, 'main', 'sponsor page');
  const cta = anchors(main).filter((link) => link.href === '/contact/');
  assert.equal(cta.length, 1, 'The sponsor page must have one call to action to /contact/.');
  assert.equal(cta[0].event, 'sponsor_inquiry', 'The sponsor call to action must send sponsor_inquiry.');
  assert.equal(cta[0].params.cta_location, 'sponsor_page');
}

// Golf registration buttons send golf_register_click. No golf event is open yet, so
// check that every generic Register button goes through registerClickEvent().
{
  const events = fs.readFileSync(path.join(root, 'src/data/events.ts'), 'utf8');
  assert.match(events, /registerClickEvent = \(event: EventRecord\) => \(event\.eventType === 'golf' \? 'golf_register_click' : 'event_register_click'\)/);
  for (const source of ['src/components/FeaturedEvent.astro', 'src/pages/events/[eventType]/[slug].astro']) {
    const text = fs.readFileSync(path.join(root, source), 'utf8');
    for (const [line] of text.matchAll(/^.*trackingAttrs\('event_register_click'.*$/gm)) {
      assert.ok(source.endsWith('[slug].astro') && line.includes("'banquet_2027_details'"), `${source}: a Register button hard-codes event_register_click; use registerClickEvent(event).`);
    }
    assert.ok(text.includes('trackingAttrs(registerClickEvent(event)'), `${source}: Register button must use registerClickEvent(event).`);
  }
}

console.log(`Analytics event tests passed on ${pages.length} pages: nav_click navigation, contact_click CTAs, sponsor_inquiry, golf_register_click.`);
