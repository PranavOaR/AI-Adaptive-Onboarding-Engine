# Data Sources Strategy & Integrity

For this Cross-Domain Hackathon MVP, the data powering the AI Onboarding Engine was curated meticulously to ensure maximum balance and fairness across software, infrastructure, and security disciplines.

## 1. Taxonomy (`taxonomy.json`)
Our canonical skill taxonomy was constructed to neutralize "dev-stack bias". It includes over 45 foundational skills symmetrically distributed across 8 primary domains:
- Programming Languages (Python, C++, Java, JS, Go, TS)
- Frontend Frameworks (React, Vue, HTML/CSS, Tailwind)
- Backend Infrastructure (Node.js, Express, Django, FastAPI, Spring)
- Databases (SQL, PostgreSQL, MySQL, MongoDB, Redis)
- Data Analytics (Pandas, NumPy, Power BI, Tableau)
- AI / Machine Learning (Scikit-Learn, TensorFlow, PyTorch, NLP)
- DevOps & Cloud (Git, Docker, Kubernetes, AWS, GCP, Azure, CI/CD, Terraform)
- Cybersecurity & AppSec (Linux, Networking, OWASP Top 10, Web Sec, API Sec, Incident Response, Pentesting)

## 2. Role Templates (`role_templates.json`)
The system strictly supports 9 distinct role profiles mimicking industry standard Junior/Intern roles to enable dynamic onboarding gap tracking.
1. Backend Engineer Intern
2. Frontend Engineer Intern
3. Full Stack Intern
4. Data Analyst Intern
5. Machine Learning Engineer Intern
6. DevOps Engineer Intern
7. Cybersecurity Intern
8. Application Security Intern
9. SOC/Security Analyst Intern

## 3. Training Catalog & Challenges (`courses.json` & `challenges.json`)
- **Courses**: 26 real-world correlated learning modules divided into 4 mandatory phases (Foundation, Core Role Skills, Applied Practice, Optional Stretch).
- **Challenges**: 12 custom evaluations, heavily weighted toward real-world performance (e.g., K8s Ingress YAML fixing, SQL Window function queries, OWASP vulnerability spotting, standard DSA puzzles).
