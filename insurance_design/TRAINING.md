# Quote model training

The demo groups existing training rows for 10 through 50 years together into
`10 years or more`. It preserves the original simulated data and labels; it does
not replace every long relationship with a ten-year input. Nunavut remains
unsupported because it is absent from the data.

From the repository root, install the backend requirements plus training-only
SMOTE support, then rebuild the artifacts:

```text
python -m pip install -r "Quote Website/Backend/requirements.txt"
python -m pip install imbalanced-learn==0.13.0
python insurance_design/retrain_quote_model.py
python -m unittest discover -s "Quote Website/Backend" -p "test_*.py"
```

Training uses a stratified 80/20 split with seed 42, fits one-hot encoding on
training rows, applies SMOTE to the training partition only, and fits balanced
logistic regression. Both `insurance_design/` and `Quote Website/Backend/`
receive the same model and encoder pair. Deploy both artifacts together.

`quote_model_evaluation.json` records the dataset checksum, sample counts,
accepted categories and metrics at the application's 0.5 decision threshold.
The previous saved model's results on the evaluation rows are reference numbers;
its original split is unknown, so they are not an independent baseline holdout.
Synthetic-data metrics do not establish real-world prediction quality. Existing
quotes can change after retraining. The premium/payout formulas are unchanged.

The API accepts `10 years or more` directly and maps older clients' individual
10-50 year selections into the same group. Values outside the trained range are
still rejected. The UI already sends the grouped value, so this fix requires
deploying latest main on the Divorce-Insurance Render service. A frontend
redeploy is only needed for other frontend changes.
