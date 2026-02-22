# SE ECS Mentoring Circular 2025 – Data for login

Fill these files from your **SE ECS Mentoring circular 2025** PDF.

## Login rules (already applied by seed script)

- **Students:** email = `rollno@crce.edu.in`, password = **roll number** (e.g. roll 42 → password `42`).
- **Mentors (teachers):** password = `teacher123`.
- Each student is linked to their **allotted mentor** via `mentorEmail`; "My mentor" in the app shows that mentor.

## Files

### 1. `mentors.json`

List of **mentors (teachers)** from the circular. One object per mentor:

```json
{ "name": "Full Name", "email": "mentor@crce.edu.in" }
```

- `name`: Mentor’s full name as in the circular.
- `email`: Mentor’s college email (must be unique). Students will reference this in `mentorEmail`.

### 2. `students.json`

List of **students** from the circular. One object per student:

```json
{ "rollNo": "42", "name": "Student Full Name", "mentorEmail": "mentor@crce.edu.in" }
```

- `rollNo`: Roll number only (used for email `rollno@crce.edu.in` and password).
- `name`: Student’s full name.
- `mentorEmail`: **Exact email** of the allotted mentor from `mentors.json`.

## How to fill from the PDF

1. From the circular, list all **mentors** with name and email → put them in `mentors.json`.
2. From the circular, list each **student** with roll number, name, and **allotted mentor’s email** → put them in `students.json`.
3. Run the seed:
   ```bash
   cd backend
   npm run seed:circular
   ```

After that, students log in with **rollno@crce.edu.in** and password = **roll number**; they will see their allotted mentor under "My mentor".
