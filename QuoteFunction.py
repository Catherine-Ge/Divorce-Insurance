import pandas as pd

# Load all three CSV files
df_age_raw = pd.read_csv("Divorce by Age.csv", header=None)
df_length_raw = pd.read_csv("Divorce by Marriage Length.csv", header=None)
df_province_clean = pd.read_csv("Divorce by Province.csv")  # <-- now it's CSV

def get_quote(age, years_together, province, age_data, length_data, province_data):
    # Match age group
    age_groups = {
        (0, 19): "Under 20 years",
        (20, 24): "20 to 24 years",
        (25, 29): "25 to 29 years",
        (30, 34): "30 to 34 years",
        (35, 39): "35 to 39 years",
        (40, 44): "40 to 44 years",
        (45, 49): "45 to 49 years",
        (50, 54): "50 to 54 years",
        (55, 59): "55 to 59 years",
        (60, 64): "60 to 64 years",
        (65, 150): "65 years and over"
    }
    age_group = next(v for k, v in age_groups.items() if k[0] <= age <= k[1])
    age_row = age_data[age_data[0] == age_group]
    age_rate = float(age_row[5]) if not age_row.empty else 0

    # Match duration
    duration_label = f"{years_together} years" if years_together > 0 else "Under 1 year"
    if duration_label not in length_data[0].values:
        duration_label = max(length_data[0], key=lambda d: int(d.split()[0]) if "year" in d else 0)
    duration_row = length_data[length_data[0] == duration_label]
    duration_rate = float(duration_row[5]) if not duration_row.empty else 0

    # Match province
    province_rate = 0
    if province in province_data.columns:
        latest_year = province_data["Year"].max()
        province_rate = float(province_data[province_data["Year"] == latest_year][province])

    # Final quote
    divorce_risk = (age_rate + duration_rate + province_rate) / 3 / 100
    average_cost = 15000
    margin = 1.2
    premium = divorce_risk * average_cost * margin

    return round(premium, 2), round(divorce_risk * 100, 2)

# Example
quote, risk = get_quote(
    age=32,
    years_together=5,
    province='Ont.',
    age_data=df_age_raw,
    length_data=df_length_raw,
    province_data=df_province_clean
)

print(f"Estimated Premium: ${quote}")
print(f"Estimated Divorce Risk: {risk}%")
