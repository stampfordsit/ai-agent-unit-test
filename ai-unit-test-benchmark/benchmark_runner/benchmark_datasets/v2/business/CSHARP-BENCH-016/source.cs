public string ValidateStock(int stock, bool discontinued)
{
    if (discontinued)
        return "DISCONTINUED";

    if (stock <= 0)
        return "OUT_OF_STOCK";

    if (stock < 5)
        return "LOW_STOCK";

    return "AVAILABLE";
}