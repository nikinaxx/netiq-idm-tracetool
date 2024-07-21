import time

def write_lines_to_file(filename, num_lines, interval):
    while True:
        file = open(filename, 'a', encoding='utf-8')
        try:
            line_number = 1
            file.write("Start transaction\n")
            for _ in range(num_lines):
                file.write(f"Transaction line {line_number}\n")
                line_number += 1
            file.flush()  # Ensure the lines are written to the file
            file.write("End transaction\n")
        finally:
            file.close()  # Ensure the file is closed
        time.sleep(interval)

if __name__ == "__main__":
    write_lines_to_file('test_files/trace_output.txt',num_lines=1000, interval=5)
