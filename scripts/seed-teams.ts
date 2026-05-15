import { db } from "../server/db.js";
import { nflTeams } from "../shared/schema.js";
import { sql } from "drizzle-orm";

const teams = [
  { abbreviation: "ARI", slug: "arizona-cardinals", city: "Arizona", name: "Cardinals", fullName: "Arizona Cardinals", conference: "NFC", division: "NFC West", displayOrder: 1 },
  { abbreviation: "ATL", slug: "atlanta-falcons", city: "Atlanta", name: "Falcons", fullName: "Atlanta Falcons", conference: "NFC", division: "NFC South", displayOrder: 2 },
  { abbreviation: "BAL", slug: "baltimore-ravens", city: "Baltimore", name: "Ravens", fullName: "Baltimore Ravens", conference: "AFC", division: "AFC North", displayOrder: 3 },
  { abbreviation: "BUF", slug: "buffalo-bills", city: "Buffalo", name: "Bills", fullName: "Buffalo Bills", conference: "AFC", division: "AFC East", displayOrder: 4 },
  { abbreviation: "CAR", slug: "carolina-panthers", city: "Carolina", name: "Panthers", fullName: "Carolina Panthers", conference: "NFC", division: "NFC South", displayOrder: 5 },
  { abbreviation: "CHI", slug: "chicago-bears", city: "Chicago", name: "Bears", fullName: "Chicago Bears", conference: "NFC", division: "NFC North", displayOrder: 6 },
  { abbreviation: "CIN", slug: "cincinnati-bengals", city: "Cincinnati", name: "Bengals", fullName: "Cincinnati Bengals", conference: "AFC", division: "AFC North", displayOrder: 7 },
  { abbreviation: "CLE", slug: "cleveland-browns", city: "Cleveland", name: "Browns", fullName: "Cleveland Browns", conference: "AFC", division: "AFC North", displayOrder: 8 },
  { abbreviation: "DAL", slug: "dallas-cowboys", city: "Dallas", name: "Cowboys", fullName: "Dallas Cowboys", conference: "NFC", division: "NFC East", displayOrder: 9 },
  { abbreviation: "DEN", slug: "denver-broncos", city: "Denver", name: "Broncos", fullName: "Denver Broncos", conference: "AFC", division: "AFC West", displayOrder: 10 },
  { abbreviation: "DET", slug: "detroit-lions", city: "Detroit", name: "Lions", fullName: "Detroit Lions", conference: "NFC", division: "NFC North", displayOrder: 11 },
  { abbreviation: "GB", slug: "green-bay-packers", city: "Green Bay", name: "Packers", fullName: "Green Bay Packers", conference: "NFC", division: "NFC North", displayOrder: 12 },
  { abbreviation: "HOU", slug: "houston-texans", city: "Houston", name: "Texans", fullName: "Houston Texans", conference: "AFC", division: "AFC South", displayOrder: 13 },
  { abbreviation: "IND", slug: "indianapolis-colts", city: "Indianapolis", name: "Colts", fullName: "Indianapolis Colts", conference: "AFC", division: "AFC South", displayOrder: 14 },
  { abbreviation: "JAX", slug: "jacksonville-jaguars", city: "Jacksonville", name: "Jaguars", fullName: "Jacksonville Jaguars", conference: "AFC", division: "AFC South", displayOrder: 15 },
  { abbreviation: "KC", slug: "kansas-city-chiefs", city: "Kansas City", name: "Chiefs", fullName: "Kansas City Chiefs", conference: "AFC", division: "AFC West", displayOrder: 16 },
  { abbreviation: "LV", slug: "las-vegas-raiders", city: "Las Vegas", name: "Raiders", fullName: "Las Vegas Raiders", conference: "AFC", division: "AFC West", displayOrder: 17 },
  { abbreviation: "LAC", slug: "los-angeles-chargers", city: "Los Angeles", name: "Chargers", fullName: "Los Angeles Chargers", conference: "AFC", division: "AFC West", displayOrder: 18 },
  { abbreviation: "LAR", slug: "los-angeles-rams", city: "Los Angeles", name: "Rams", fullName: "Los Angeles Rams", conference: "NFC", division: "NFC West", displayOrder: 19 },
  { abbreviation: "MIA", slug: "miami-dolphins", city: "Miami", name: "Dolphins", fullName: "Miami Dolphins", conference: "AFC", division: "AFC East", displayOrder: 20 },
  { abbreviation: "MIN", slug: "minnesota-vikings", city: "Minnesota", name: "Vikings", fullName: "Minnesota Vikings", conference: "NFC", division: "NFC North", displayOrder: 21 },
  { abbreviation: "NE", slug: "new-england-patriots", city: "New England", name: "Patriots", fullName: "New England Patriots", conference: "AFC", division: "AFC East", displayOrder: 22 },
  { abbreviation: "NO", slug: "new-orleans-saints", city: "New Orleans", name: "Saints", fullName: "New Orleans Saints", conference: "NFC", division: "NFC South", displayOrder: 23 },
  { abbreviation: "NYG", slug: "new-york-giants", city: "New York", name: "Giants", fullName: "New York Giants", conference: "NFC", division: "NFC East", displayOrder: 24 },
  { abbreviation: "NYJ", slug: "new-york-jets", city: "New York", name: "Jets", fullName: "New York Jets", conference: "AFC", division: "AFC East", displayOrder: 25 },
  { abbreviation: "PHI", slug: "philadelphia-eagles", city: "Philadelphia", name: "Eagles", fullName: "Philadelphia Eagles", conference: "NFC", division: "NFC East", displayOrder: 26 },
  { abbreviation: "PIT", slug: "pittsburgh-steelers", city: "Pittsburgh", name: "Steelers", fullName: "Pittsburgh Steelers", conference: "AFC", division: "AFC North", displayOrder: 27 },
  { abbreviation: "SF", slug: "san-francisco-49ers", city: "San Francisco", name: "49ers", fullName: "San Francisco 49ers", conference: "NFC", division: "NFC West", displayOrder: 28 },
  { abbreviation: "SEA", slug: "seattle-seahawks", city: "Seattle", name: "Seahawks", fullName: "Seattle Seahawks", conference: "NFC", division: "NFC West", displayOrder: 29 },
  { abbreviation: "TB", slug: "tampa-bay-buccaneers", city: "Tampa Bay", name: "Buccaneers", fullName: "Tampa Bay Buccaneers", conference: "NFC", division: "NFC South", displayOrder: 30 },
  { abbreviation: "TEN", slug: "tennessee-titans", city: "Tennessee", name: "Titans", fullName: "Tennessee Titans", conference: "AFC", division: "AFC South", displayOrder: 31 },
  { abbreviation: "WAS", slug: "washington-commanders", city: "Washington", name: "Commanders", fullName: "Washington Commanders", conference: "NFC", division: "NFC East", displayOrder: 32 },
];

async function seedTeams() {
  console.log("Seeding NFL teams...");
  for (const team of teams) {
    await db.insert(nflTeams)
      .values(team)
      .onConflictDoUpdate({
        target: nflTeams.abbreviation,
        set: { ...team },
      });
  }
  console.log(`Seeded ${teams.length} NFL teams.`);
  process.exit(0);
}

seedTeams().catch((err) => {
  console.error(err);
  process.exit(1);
});
