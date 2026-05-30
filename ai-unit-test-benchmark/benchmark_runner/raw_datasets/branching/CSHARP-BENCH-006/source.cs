public decimal CalculateShipping(decimal total)
{
    if (total >= 500)
        return 0;

    return 50;
}