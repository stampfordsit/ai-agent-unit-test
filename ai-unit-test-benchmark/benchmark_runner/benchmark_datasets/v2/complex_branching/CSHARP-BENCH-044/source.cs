public class InventoryService
{
    public string GetStockStatus(int score, bool isVip, bool isActive)
    {
        if (!isActive)
            return "INACTIVE";

        if (isVip)
        {
            if (score >= 90)
                return "VIP-GOLD";

            if (score >= 70)
                return "VIP-SILVER";

            return "VIP-BASIC";
        }

        if (score >= 80)
            return "GOLD";

        if (score >= 60)
            return "SILVER";

        return "BASIC";
    }
}