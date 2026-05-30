import sys
from pathlib import Path

ROOT_DIR = (Path(__file__).resolve().parents[1])
sys.path.append(str(ROOT_DIR))

from summary.generate.generate_category_report import (generate_category_report)
from summary.generate.generate_cost_report import (generate_cost_report)
from summary.generate.generate_failure_report import (generate_failure_report)
from summary.generate.generate_latency_report import (generate_latency_report)
from summary.generate.generate_summary_report import (generate_summary_report)
from summary.generate.generate_healing_report import (generate_healing_report)
from summary.generate.generate_category_split_report import (generate_category_split_report)
from summary.generate.generate_evaluator_report import (generate_evaluator_report)
from summary.generate.generate_best_of_n_report import (generate_best_of_n_report)
from summary.generate.generate_mutation_report import (generate_mutation_report)


def main():
    print("=" * 50)
    print("GENERATING REPORTS")
    print("=" * 50)

    try:
        print("\n[1] Category Report")
        generate_category_report()
    except Exception as e:
        print(f"Category report failed: {e}")

    try:
        print("\n[2] Cost Report")
        generate_cost_report()
    except Exception as e:
        print(f"Cost report failed: {e}")

    try:
        print("\n[3] Failure Report")
        generate_failure_report()
    except Exception as e:
        print(f"Failure report failed: {e}")

    try:
        print("\n[4] Latency Report")
        generate_latency_report()
    except Exception as e:
        print(f"Latency report failed: {e}")

    try:
        print("\n[5] Summary Report")
        generate_summary_report()
    except Exception as e:
        print(f"Summary report failed: {e}")

    try:
        print("\n[6] Self-Healing Report")
        generate_healing_report()
    except Exception as e:
        print(f"Self-Healing report failed: {e}")

    try:
        print("\n[7] Category Split Report (synthetic vs real_world)")
        generate_category_split_report()
    except Exception as e:
        print(f"Category split report failed: {e}")

    try:
        print("\n[8] Evaluator-Guided Report")
        generate_evaluator_report()
    except Exception as e:
        print(f"Evaluator-Guided report failed: {e}")

    try:
        print("\n[9] Best-of-N Selection Report")
        generate_best_of_n_report()
    except Exception as e:
        print(f"Best-of-N selection report failed: {e}")

    try:
        print("\n[10] Mutation Testing Report")
        generate_mutation_report()
    except Exception as e:
        print(f"Mutation report failed: {e}")



    print("\n" + "=" * 50)
    print("REPORT GENERATION COMPLETED")
    print("=" * 50)

if __name__ == "__main__":
    main()