# Developer's Guide to the Machine Learning Service

Welcome! If you are a software developer with little to no background in Machine Learning (ML), this guide is written specifically for you. It explains how the ML service in this project works, mapping ML concepts to standard software engineering concepts.

## 1. What is Machine Learning (in simple terms)?
In traditional programming, you write **rules** (if/else statements) to process **data** and get **answers**.
```javascript
// Traditional Programming
if (sleep < 5 && mood < 2) return "CRITICAL";
```

In Machine Learning, you provide the **data** and the **answers** (labels), and the algorithm figures out the **rules** for you. Once trained, you save those rules into a file (the `model.pkl`) and use it to predict answers for new, unseen data.

## 2. The Core Pipeline
Our ML service consists of three main phases:
1. **Data Generation & Preprocessing** (Creating the training data)
2. **Training & Evaluation** (Teaching the model)
3. **Inference / Serving** (Using the model in an API)

Let's break down how each phase works in `train_model.py` and `main.py`.

---

### Phase 1: Data Generation (The "Experience")
*Found in `train_model.py`*

An ML model learns from experience, which comes in the form of datasets. Our dataset consists of:
- **Features (The Inputs):** `sleep`, `sentiment`, `mood`, `negKeywords`.
- **Target / Label (The Output):** `SAFE` (0), `WARNING` (1), `CRITICAL` (2).

Since we didn't have thousands of real user logs, we wrote a function `generate_synthetic_data()` to generate 1,500 fake records. We mathematically defined what a "SAFE" user looks like (e.g., 7-10 hours of sleep, good mood) and what a "CRITICAL" user looks like (low sleep, bad mood). The model will use this data to learn the boundaries between the classes.

### Phase 2: Training (The "Learning")
*Found in `train_model.py`*

We use an algorithm called **Random Forest**. 

**What is a Random Forest?**
Imagine you want to decide whether to go out or stay home. You ask 100 friends (who all have slightly different preferences). If 80 say "go out" and 20 say "stay home," you go out. 
A Random Forest does exactly this. It builds hundreds of mathematical "Decision Trees" (like nested if/else statements). When new data comes in, every tree votes on the outcome, and the majority wins. It's incredibly robust and resistant to errors.

**Cross-Validation & Hyperparameter Tuning:**
- **Hyperparameters** are the configuration settings for the algorithm (e.g., how many trees to build, how deep the if/else statements can go).
- We use a tool called `GridSearchCV` which tries out dozens of different configurations to find the absolute best one.
- **Cross-Validation** is a testing technique. Instead of testing the model once, we split the data into 5 chunks, train on 4 chunks, and test on the 5th. We do this 5 times, rotating the test chunk. This proves the model is genuinely smart and hasn't just memorized the answers.

Once the model is fully trained and verified, we "serialize" (save) it to disk as `model.pkl` using a library called `joblib`.

---

### Phase 3: Inference (The "API Serving")
*Found in `main.py`*

Now we have a smart `model.pkl` file, but a Node.js backend can't directly read Python objects easily. We need a bridge. That's where **FastAPI** comes in.

1. **Loading the Model:** When you start the FastAPI server, it loads `model.pkl` from the hard drive into memory.
2. **The Endpoint:** We expose a `POST /predict` endpoint.
3. **Validation:** We use Pydantic to ensure the incoming JSON from your Node backend is clean and formatted correctly.
4. **Prediction:** We take the 4 features, put them into a Pandas DataFrame, and pass them to `model.predict(input_data)`. The model runs the data through its hundreds of trees and spits out `0`, `1`, or `2`.
5. **Contextual Reasoning:** Our `generate_reason()` function looks at the prediction and the input data to construct a human-readable explanation of *why* the model made that choice.
6. **Response:** We return the risk level and the reason back to the Node.js backend!

## Summary for the Developer
- `train_model.py` is like a build script. You run it once to compile your "code" (the model).
- `model.pkl` is your compiled binary.
- `main.py` is just a standard web server that wraps around that compiled binary to expose it over HTTP.

Whenever you want to make the model smarter, you add more rows to the dataset in `train_model.py`, re-run the script to generate a new `model.pkl`, and restart the FastAPI server. That's the entire ML lifecycle in a nutshell!
