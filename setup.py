from setuptools import setup, find_packages

with open("requirements.txt") as f:
    requirements = f.read().splitlines()


setup(
    name = "AniVerse",
    version="0.1",
    author="Saurav Sabu",
    packages=find_packages(),
    install_requires=requirements
)