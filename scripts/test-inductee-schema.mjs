// Person structured data and "same class" links on inductee profiles. Everything
// must come from src/data/inductees.json; nothing is invented. Reads dist/.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
assert.ok(fs.existsSync(dist), 'Run npm run build before the inductee schema tests.');
const inductees = JSON.parse(fs.readFileSync(path.join(root, 'src/data/inductees.json'), 'utf8'));
const decode = (text) => text.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');

// Only these Person properties may appear: each maps to a field in inductees.json
// or to the page itself.
const allowedPersonKeys = new Set(['@type', '@id', 'name', 'url', 'mainEntityOfPage', 'description', 'image', 'award', 'memberOf']);

for (const record of inductees) {
  const relative = path.join(record.proposed_canonical_url.replace(/^\//, ''), 'index.html');
  const html = fs.readFileSync(path.join(dist, relative), 'utf8');
  const canonical = `https://jrhof.org${record.proposed_canonical_url}`;

  // JSON-LD parses and holds a valid Person tied to the organization.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(([, block]) => JSON.parse(block));
  const graph = blocks.flatMap((block) => block['@graph'] ?? [block]);
  const organization = graph.find((node) => [].concat(node['@type']).includes('Organization'));
  assert.ok(organization?.['@id'], `${relative}: the Organization node is missing`);
  const people = graph.filter((node) => node['@type'] === 'Person');
  assert.equal(people.length, 1, `${relative}: expected one Person`);
  const person = people[0];
  assert.equal(blocks[0]['@context'], 'https://schema.org', `${relative}: wrong @context`);
  for (const key of Object.keys(person)) assert.ok(allowedPersonKeys.has(key), `${relative}: unexpected Person property ${key}`);
  assert.equal(person['@id'], `${canonical}#person`);
  assert.equal(person.name, record.display_name);
  assert.equal(person.url, canonical);
  const expectedAward = record.induction_year
    ? `Joe Rossi Umpires Hall of Fame inductee, Class of ${record.induction_year}`
    : 'Joe Rossi Umpires Hall of Fame inductee, inducted before 1990';
  assert.equal(person.award, expectedAward, `${relative}: award must state the honor and year from the data`);
  assert.equal(person.memberOf?.['@type'], 'OrganizationRole', `${relative}: memberOf must be an OrganizationRole`);
  assert.equal(person.memberOf.roleName, 'Hall of Fame inductee');
  assert.deepEqual(person.memberOf.memberOf, { '@id': organization['@id'] }, `${relative}: memberOf must point at the organization`);
  if (record.induction_year) assert.equal(person.memberOf.startDate, String(record.induction_year), `${relative}: wrong induction year`);
  else {
    assert.equal(record.induction_era, 'Pre 1990');
    assert.ok(!('startDate' in person.memberOf), `${relative}: an era-only record must not get a year`);
  }
  const webPage = graph.find((node) => node['@id'] === `${canonical}#webpage`);
  assert.deepEqual(webPage?.mainEntity, { '@id': person['@id'] }, `${relative}: the page's mainEntity must be the Person`);

  // "Also in the Class of" lists exactly the other inductees of that year.
  const section = html.match(/<nav class="same-class"[\s\S]*?<\/nav>/)?.[0];
  const expected = record.induction_year
    ? inductees.filter((other) => other.induction_year === record.induction_year && other.stable_id !== record.stable_id)
    : [];
  if (!expected.length) {
    assert.equal(section, undefined, `${relative}: no class links expected`);
    continue;
  }
  assert.ok(section, `${relative}: the same-class links are missing`);
  assert.ok(section.includes(`Also in the Class of ${record.induction_year}`), `${relative}: wrong same-class heading`);
  const links = [...section.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(([, href, name]) => ({ href, name: decode(name) }));
  assert.deepEqual(
    links.map((link) => link.href).sort(),
    expected.map((other) => other.proposed_canonical_url).sort(),
    `${relative}: same-class links must match inductees.json`,
  );
  for (const link of links) {
    const other = expected.find((candidate) => candidate.proposed_canonical_url === link.href);
    assert.equal(link.name, other.display_name, `${relative}: link text must be the inductee's display name`);
    assert.ok(fs.existsSync(path.join(dist, link.href, 'index.html')), `${relative}: ${link.href} does not exist`);
  }
  assert.ok(!section.includes(record.proposed_canonical_url + '"'), `${relative}: a profile must not link to itself`);
}

console.log(`Inductee schema tests passed on ${inductees.length} profiles: Person JSON-LD (award, OrganizationRole with year) and same-class links.`);
