import { VercelRequest, VercelResponse } from '@vercel/node';
import { moderateComment } from '../lib/moderation';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const comments = [
"Still a grestbplace went here a few weeks ago its art is amazing definitely recommend",
"Saw someone painting here earlier today, still a good spot to paint ",
"Good spot paint over old pieces leave good pieces alone ",
"Still a good spot and now officially legal. Keep your beef off legal walls though. ",
"Its astor park and it is a dedicated wall for graffitti artists...it is a family park so its good morals to keep it clean and take your rubbish with you have fun i look forwarf to seeing some new names up ! ",
"Still good ",
"Im was painting in 2018, and wall is not super flat, nice place. Its still safe im was painting couple hours ",
"astor park, isnt 8ft tall, 6 at best. anyways, good spot. visted recently and still legal. E ",
"Information above is correct ",
"yeah massive wall great peice's on there. ",
"*also known as Astor Park. ",
"2025 immernoch aktiv, teils doll zugewachsen also nur zu fuß erreichbar ",
"framer protest ",
"nico bruder ",
"Polenböller explodiert... ",
"H ",
"Wall is illegal ",
"Its Karens backyard",
"I painted there so many times the men’s and women’s call police but the police say that is legal there ",
"Hall absolut legal... Schöne hohe Wände,schöner spot im Park...schwer zu finden, allerdings wenn Anwohner gefragt werden geht es... ",
"September 2022, fame ist immernoch safe und Aktiv bemalt. Führt durch ein kleines Waldstück. Ist zu fuß und mit Fahrrad erreichbar, würde eine Heckenschere empfehlen. ",
"Ich war im Juli 2019 da. Die fame ist noch aktiv, aber nur zu Fuß erreichbar und an manchen Stellen zugewachsen. Also zusätzlich mal ne heckenschere mit am Bord. ",
  ]

  const comment = comments[Math.floor(Math.random() * comments.length)];
  
  try {
    const result = await moderateComment(comment);
    return response.status(200).json({comment, result});
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
