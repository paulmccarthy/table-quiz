# Table Quiz Management App
Web based application used to run table quizzes across multiple locations simultaneously.

## Requirements
1. Secure User Management, with multiple roles: admins, quizmasters, and players.
2. Secure login, supporting passwords, passkeys, OAuth via Facebook, Microsoft, Github.
3. Secure password management, with self-password reset capabilities, or reset by admins.
4. Email verification required for new accounts.
5. Each Quiz has its own unique login page and access code for inviting players.
6. Quizzes can also be shared via email invitation or shareable link.
7. Question bank with answers.
8. Questions may be used by multiple quizzes.
9. Questions can have a difficulty level (easy, medium, hard).
10. Supports quiz teams and individual players.
11. Automatic score tracking with manual quizmaster override if required.
12. Question types include Multiple Choice, pictures, audio, video.
13. Questions are presented in a fixed order.
14. Questions can be timed, or advance based on quizmaster actions.
15. Players can change their answer as many times as they want before the timer expires or the quizmaster moves on to the next question.
16. Answers can be multiple choice, freeform text, or player drawings.
17. Quizmasters can mark drawn answers as correct or incorrect.
18. Leaderboard displayed at the end of each round.
19. Number of questions per round configurable and each round can have different number of questions.
20. Configurable number of rounds.
21. Quizzes can be private or public.
22. Private quizzes require quizmaster to admit each player.
23. Public quizzes allow any user to register.
24. Players can create their own teams or be assigned a team by a quizmaster.
25. Teams can have a maximum of 6 players.
26. Quizmasters can choose to assign players to teams randomly.
27. Players can choose their team name after being randomly assigned.
28. Admins have access to all quizzes.
29. Quizmasters can create, update, delete only their own quizzes.
30. A quizmaster can only run one quiz at a time.
31. Quizzes are started manually by the quizmaster.
32. Quizmasters can pause and resume a quiz.
33. If a player disconnects, they can reconnect and resume the quiz.
34. Quiz history and results are stored and viewable by players and quizmasters.
35. Quizmasters can export quiz results as CSV or PDF.
36. Rate limiting on login, access code, and API endpoints to prevent brute-force attacks.

## Non-functional Requirements
* Application must be written in NodeJS.
* All dependencies managed by npm.
* Backend REST API must be in expressjs.
* All tests to be written using mocha and chaijs in TDD format.
* Frontend must use Bootstrap and pug for templating.
* All code must be unit tested with >= 95% code coverage.
* Use eslint-airbnb for linting.
* Use mysql for the database.
* Use websockets for comms between the REST API and the front end.
* Use canvas based drawing tools for drawing answers.
* Media files (pictures, audio, video) stored on local filesystem with configurable storage backend.
* Use a configurable session store (default MySQL-backed) for scalability.
