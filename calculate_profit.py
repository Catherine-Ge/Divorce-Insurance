import pandas as pd

def calculate_insurance_profit(csv_path="predicted_premiums.csv", claim_amount=15000):
    # Load predictions and premium data
    df = pd.read_csv(csv_path)

    # Step 1: Calculate claim payout based on actual divorce
    df["Claim_Paid"] = df["Actual_Divorced"] * claim_amount

    # Step 2: Sum premiums and claims
    total_premiums = df["Premium"].sum()
    total_claims = df["Claim_Paid"].sum()
    profit = total_premiums - total_claims
    loss_ratio = total_claims / total_premiums

    # Step 3: Output summary
    print("\n=== Insurance Profitability Summary ===")
    print(f"Total Premium Collected: ${total_premiums:,.2f}")
    print(f"Total Claims Paid:      ${total_claims:,.2f}")
    print(f"Total Profit:            ${profit:,.2f}")
    print(f"Loss Ratio:              {loss_ratio:.3f}")

    return {
        "Total Premium Collected": round(total_premiums, 2),
        "Total Claims Paid": round(total_claims, 2),
        "Total Profit": round(profit, 2),
        "Loss Ratio": round(loss_ratio, 3)
    }

# Run if executed as a script
if __name__ == "__main__":
    calculate_insurance_profit()
