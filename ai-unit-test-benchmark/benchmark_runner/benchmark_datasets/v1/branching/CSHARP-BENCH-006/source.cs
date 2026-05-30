public decimal CalculateDiscount(decimal price)
{
    if (price > 1000)
        return price * 0.9m;

    return price;
}