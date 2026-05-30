public class UserServiceTests
{
    [Fact]
    public async Task GetUserAsync_ShouldReturnUser_WhenUserExists()
    {
        var mockRepo = new Mock<IUserRepository>();

        mockRepo
            .Setup(x => x.GetByIdAsync(1))
            .ReturnsAsync(new User
            {
                Id = 1,
                Name = "John"
            });

        var service = new UserService(mockRepo.Object);

        var result = await service.GetUserAsync(1);

        Assert.NotNull(result);
        Assert.Equal(1, result!.Id);
        Assert.Equal("John", result.Name);
    }
}