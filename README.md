
cd backend
python -m venv .venv
<!-- Windows:  -->
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000


cd frontend
npm install
npm run dev
